import {
  COUNTRIES,
  findCountry,
  findCustomer,
  findProduct,
  findSupplier,
} from "./data.ts";
import type { Certificate, Country, Customer, Product, Supplier } from "./data.ts";

export type Decision = "APPROVED" | "REJECTED" | "HUMAN_REVIEW";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ToolCall {
  tool: string;
  input: Record<string, string>;
  summary: string;
}

export interface CheckResult {
  requirement: string;
  source: "country" | "customer";
  status: "PASS" | "FAIL" | "MISSING";
  detail: string;
}

export interface ComplianceReport {
  decision: Decision;
  riskLevel: RiskLevel;
  product: { id: string; name: string; supplier: string } | null;
  market: string;
  customer: string;
  rulesChecked: string[];
  certificatesPresent: { type: string; issuer: string; expiresAt: string; valid: boolean }[];
  missingRequirements: string[];
  checks: CheckResult[];
  justification: string;
  requiredAction: string | null;
  toolCalls: ToolCall[];
}

const EXPIRY_WARNING_DAYS = 180;

function daysUntil(dateStr: string, now: Date): number {
  return Math.floor((new Date(dateStr).getTime() - now.getTime()) / 86_400_000);
}

function isExpired(cert: Certificate, now: Date): boolean {
  return new Date(cert.expiresAt).getTime() < now.getTime();
}

export function getProductTool(productId: string): { product: Product | null; supplier: Supplier | null } {
  const product = findProduct(productId) ?? null;
  const supplier = product ? findSupplier(product.supplierId) ?? null : null;
  return { product, supplier };
}

export function getCountryRulesTool(country: string): Country | null {
  return findCountry(country) ?? null;
}

export function getCustomerRulesTool(customer: string): Customer | null {
  return findCustomer(customer) ?? null;
}

export function checkCertificatesTool(product: Product, now: Date) {
  return product.certificates.map((cert) => ({
    type: cert.type,
    issuer: cert.issuer,
    expiresAt: cert.expiresAt,
    valid: !isExpired(cert, now),
    daysRemaining: daysUntil(cert.expiresAt, now),
  }));
}

export function runComplianceCheck(
  productId: string,
  country: string,
  customer: string,
  now: Date = new Date()
): ComplianceReport {
  const toolCalls: ToolCall[] = [];

  const { product, supplier } = getProductTool(productId);
  toolCalls.push({
    tool: "get_product",
    input: { product_id: productId },
    summary: product ? `Found ${product.id} (${product.name}), supplier ${supplier?.name}` : `No product found for id ${productId}`,
  });

  const countryRules = getCountryRulesTool(country);
  toolCalls.push({
    tool: "get_country_rules",
    input: { country },
    summary: countryRules
      ? `${countryRules.name} requires: ${countryRules.requiredRules.join(", ")}`
      : `No rule set found for market ${country}`,
  });

  const customerRules = getCustomerRulesTool(customer);
  toolCalls.push({
    tool: "get_customer_rules",
    input: { customer },
    summary: customerRules
      ? `${customerRules.name} requires: ${customerRules.requiredCerts.join(", ")}${customerRules.supplierAuditRequired ? " + supplier audit" : ""}`
      : `No rule set found for customer ${customer}`,
  });

  const base = {
    product: product && supplier ? { id: product.id, name: product.name, supplier: supplier.name } : null,
    market: countryRules?.name ?? country,
    customer: customerRules?.name ?? customer,
    toolCalls,
  };

  // Guardrail: never invent compliance status. Unknown inputs require human review.
  if (!product || !supplier || !countryRules || !customerRules) {
    const unknown: string[] = [];
    if (!product) unknown.push(`product "${productId}" is not in the product database`);
    if (product && !supplier) unknown.push(`supplier "${product.supplierId}" is not in the supplier database`);
    if (!countryRules) unknown.push(`market "${country}" has no indexed rule set`);
    if (!customerRules) unknown.push(`customer "${customer}" has no indexed rule set`);
    return {
      ...base,
      decision: "HUMAN_REVIEW",
      riskLevel: "MEDIUM",
      rulesChecked: [],
      certificatesPresent: [],
      missingRequirements: [],
      checks: [],
      justification: `Compliance status cannot be verified: ${unknown.join("; ")}. Per policy, the agent never invents a compliance status and escalates to human review.`,
      requiredAction: "A compliance officer must verify the missing master data before any decision.",
    };
  }

  const certs = checkCertificatesTool(product, now);
  toolCalls.push({
    tool: "check_certificates",
    input: { product_id: product.id },
    summary: certs.length
      ? certs.map((c) => `${c.type} (${c.valid ? "valid" : "EXPIRED"}, expires ${c.expiresAt})`).join("; ")
      : "Product has no certificates on file",
  });

  const requiredCerts = Array.from(new Set([...countryRules.requiredRules, ...customerRules.requiredCerts]));
  const checks: CheckResult[] = [];
  const missing: string[] = [];

  for (const req of countryRules.requiredRules) {
    const cert = certs.find((c) => c.type === req);
    if (!cert) {
      checks.push({ requirement: req, source: "country", status: "MISSING", detail: `Required by ${countryRules.name} market rules, not on file for this product` });
      missing.push(`${req} certification (required by ${countryRules.name})`);
    } else if (!cert.valid) {
      checks.push({ requirement: req, source: "country", status: "FAIL", detail: `Certificate expired on ${cert.expiresAt}` });
      missing.push(`${req} certification expired on ${cert.expiresAt} (required by ${countryRules.name})`);
    } else {
      checks.push({ requirement: req, source: "country", status: "PASS", detail: `Valid certificate by ${cert.issuer}, expires ${cert.expiresAt}` });
    }
  }

  for (const req of customerRules.requiredCerts) {
    if (countryRules.requiredRules.includes(req)) continue;
    const cert = certs.find((c) => c.type === req);
    if (!cert) {
      checks.push({ requirement: req, source: "customer", status: "MISSING", detail: `Required by ${customerRules.name} supplier policy, not on file for this product` });
      missing.push(`${req} certification (required by ${customerRules.name})`);
    } else if (!cert.valid) {
      checks.push({ requirement: req, source: "customer", status: "FAIL", detail: `Certificate expired on ${cert.expiresAt}` });
      missing.push(`${req} certification expired on ${cert.expiresAt} (required by ${customerRules.name})`);
    } else {
      checks.push({ requirement: req, source: "customer", status: "PASS", detail: `Valid certificate by ${cert.issuer}, expires ${cert.expiresAt}` });
    }
  }

  if (customerRules.supplierAuditRequired) {
    const audit = supplier.audit;
    const auditValid = audit !== null && audit.passed && daysUntil(audit.nextAuditDue, now) >= 0;
    if (!auditValid) {
      const detail =
        audit === null
          ? `No supplier audit on file for ${supplier.name}`
          : !audit.passed
            ? `Last audit of ${supplier.name} on ${audit.auditedAt} did not pass`
            : `Audit of ${supplier.name} expired (next audit was due ${audit.nextAuditDue})`;
      checks.push({ requirement: "SUPPLIER_AUDIT", source: "customer", status: "FAIL", detail });
      missing.push(`Valid supplier audit for ${supplier.name} (required by ${customerRules.name})`);
    } else {
      checks.push({ requirement: "SUPPLIER_AUDIT", source: "customer", status: "PASS", detail: `${supplier.name} audited on ${audit.auditedAt}, next audit due ${audit.nextAuditDue}` });
    }
  }

  const passed = checks.filter((c) => c.status === "PASS");
  const soonestExpiry = certs
    .filter((c) => c.valid)
    .map((c) => c.daysRemaining)
    .sort((a, b) => a - b)[0];

  if (missing.length > 0) {
    return {
      ...base,
      decision: "REJECTED",
      riskLevel: "HIGH",
      rulesChecked: [...countryRules.requiredRules, ...customerRules.requiredCerts],
      certificatesPresent: certs.map(({ type, issuer, expiresAt, valid }) => ({ type, issuer, expiresAt, valid })),
      missingRequirements: missing,
      checks,
      justification: `Launch in ${countryRules.name} for ${customerRules.name} is rejected: ${missing.length} requirement(s) not met. ${countryRules.name} market rules require ${countryRules.requiredRules.join(" and ")}; ${customerRules.name} requires ${customerRules.requiredCerts.join(", ") || "no specific certificates"}${customerRules.supplierAuditRequired ? " and a passed supplier audit" : ""}.`,
      requiredAction: `Resolve before market launch: ${missing.map((m) => m.split(" (")[0]).join("; ")}.`,
      toolCalls,
    };
  }

  const risk: RiskLevel = soonestExpiry !== undefined && soonestExpiry < EXPIRY_WARNING_DAYS ? "MEDIUM" : "LOW";
  const expiryNote =
    risk === "MEDIUM"
      ? ` Note: the earliest certificate expires in ${soonestExpiry} days; schedule renewal.`
      : "";

  return {
    ...base,
    decision: "APPROVED",
    riskLevel: risk,
    rulesChecked: [...countryRules.requiredRules, ...customerRules.requiredCerts],
    certificatesPresent: certs.map(({ type, issuer, expiresAt, valid }) => ({ type, issuer, expiresAt, valid })),
    missingRequirements: [],
    checks,
    justification: `All ${passed.length} requirements verified via tool lookups: ${countryRules.name} market rules (${countryRules.requiredRules.join(", ")}) and ${customerRules.name} customer rules (${customerRules.requiredCerts.join(", ") || "no specific certificates"}${customerRules.supplierAuditRequired ? ", supplier audit" : ""}) are satisfied with valid certificates.${expiryNote}`,
    requiredAction: risk === "MEDIUM" ? "Schedule renewal for the certificate expiring soon." : null,
    toolCalls,
  };
}

export interface CountryComparison {
  country: string;
  decision: Decision;
  riskLevel: RiskLevel;
  missingRequirements: string[];
  justification: string;
}

export function compareCountries(productId: string, customer: string, now: Date = new Date()): CountryComparison[] {
  return COUNTRIES.map((c) => {
    const report = runComplianceCheck(productId, c.name, customer, now);
    return {
      country: c.name,
      decision: report.decision,
      riskLevel: report.riskLevel,
      missingRequirements: report.missingRequirements,
      justification: report.justification,
    };
  });
}
