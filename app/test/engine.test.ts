import assert from "node:assert/strict";
import { test } from "node:test";
import { runComplianceCheck, compareCountries } from "../lib/engine.ts";

const NOW = new Date("2026-05-01T00:00:00Z");

test("P-100 in Germany for Decathlon is APPROVED with LOW risk", () => {
  const r = runComplianceCheck("P-100", "Germany", "Decathlon", NOW);
  assert.equal(r.decision, "APPROVED");
  assert.equal(r.riskLevel, "LOW");
  assert.equal(r.missingRequirements.length, 0);
  assert.ok(r.justification.includes("REACH"));
  assert.ok(r.justification.includes("GPSR"));
  assert.equal(r.toolCalls.length, 4);
});

test("P-200 in Germany for Decathlon is REJECTED for missing OEKO-TEX", () => {
  const r = runComplianceCheck("P-200", "Germany", "Decathlon", NOW);
  assert.equal(r.decision, "REJECTED");
  assert.ok(r.missingRequirements.some((m) => m.includes("OEKO-TEX")));
  assert.ok(r.missingRequirements.some((m) => m.toLowerCase().includes("supplier audit")));
  assert.equal(r.riskLevel, "HIGH");
});

test("P-200 in Germany for Zalando is REJECTED for missing OEKO-TEX but not audit", () => {
  const r = runComplianceCheck("P-200", "Germany", "Zalando", NOW);
  assert.equal(r.decision, "REJECTED");
  assert.ok(r.missingRequirements.some((m) => m.includes("OEKO-TEX")));
  assert.ok(!r.missingRequirements.some((m) => m.toLowerCase().includes("audit")));
});

test("unknown product escalates to HUMAN_REVIEW instead of guessing", () => {
  const r = runComplianceCheck("P-999", "Germany", "Decathlon", NOW);
  assert.equal(r.decision, "HUMAN_REVIEW");
  assert.ok(r.justification.includes("never invents"));
});

test("unknown market escalates to HUMAN_REVIEW", () => {
  const r = runComplianceCheck("P-100", "Japan", "Decathlon", NOW);
  assert.equal(r.decision, "HUMAN_REVIEW");
});

test("expired certificate fails the check", () => {
  const r = runComplianceCheck("P-116", "Germany", "Decathlon", NOW);
  assert.equal(r.decision, "REJECTED");
  assert.ok(r.missingRequirements.some((m) => m.includes("expired")));
});

test("multi-country comparison: P-100 for Decathlon passes Germany and France, fails UK and USA", () => {
  const rows = compareCountries("P-100", "Decathlon", NOW);
  assert.equal(rows.length, 4);
  const byCountry = Object.fromEntries(rows.map((r) => [r.country, r.decision]));
  assert.equal(byCountry["Germany"], "APPROVED");
  assert.equal(byCountry["France"], "APPROVED");
  assert.equal(byCountry["United Kingdom"], "REJECTED");
  assert.equal(byCountry["United States"], "REJECTED");
  const uk = rows.find((r) => r.country === "United Kingdom")!;
  assert.ok(uk.missingRequirements.some((m) => m.includes("UKCA")));
  const us = rows.find((r) => r.country === "United States")!;
  assert.ok(us.missingRequirements.some((m) => m.includes("CPSIA")));
});

test("soon-expiring certificates raise risk to MEDIUM on approval", () => {
  // P-101 GOTS expires 2026-04-10 → already expired at NOW; use H&M (needs GOTS) → REJECTED instead
  const r = runComplianceCheck("P-101", "Germany", "H&M", NOW);
  assert.equal(r.decision, "REJECTED");
  assert.ok(r.missingRequirements.some((m) => m.includes("GOTS")));
});
