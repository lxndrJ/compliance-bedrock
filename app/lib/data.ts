export type CountryCode = "GERMANY" | "FRANCE" | "UK" | "USA";

export interface Certificate {
  type: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  audit: { passed: boolean; auditedAt: string; nextAuditDue: string } | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  certificates: Certificate[];
}

export interface Customer {
  id: string;
  name: string;
  requiredCerts: string[];
  supplierAuditRequired: boolean;
}

export interface Country {
  code: CountryCode;
  name: string;
  requiredRules: string[];
}

export const CERTIFICATE_TYPES = [
  "OEKO-TEX",
  "REACH",
  "GPSR",
  "SUPPLIER_AUDIT",
  "UKCA",
  "CPSIA",
  "CE",
  "BSCI",
  "GOTS",
  "ISO9001",
] as const;

export const SUPPLIERS: Supplier[] = [
  { id: "SUP#ABC", name: "ABC Textiles", country: "Portugal", audit: { passed: true, auditedAt: "2025-03-10", nextAuditDue: "2027-03-10" } },
  { id: "SUP#XYZ", name: "XYZ Manufacturing", country: "China", audit: { passed: false, auditedAt: "2024-11-02", nextAuditDue: "2025-11-02" } },
  { id: "SUP#NOR", name: "Nordic Outdoor", country: "Sweden", audit: { passed: true, auditedAt: "2025-01-20", nextAuditDue: "2027-01-20" } },
  { id: "SUP#TAC", name: "Tactical Gear Co", country: "Germany", audit: { passed: true, auditedAt: "2025-06-01", nextAuditDue: "2026-06-01" } },
  { id: "SUP#GLO", name: "Global Sportswear", country: "Vietnam", audit: { passed: true, auditedAt: "2025-05-15", nextAuditDue: "2027-05-15" } },
];

export const CUSTOMERS: Customer[] = [
  { id: "CUSTOMER#DECATHLON", name: "Decathlon", requiredCerts: ["OEKO-TEX"], supplierAuditRequired: true },
  { id: "CUSTOMER#BUNDESWEHR", name: "Bundeswehr", requiredCerts: ["ISO9001"], supplierAuditRequired: true },
  { id: "CUSTOMER#H&M", name: "H&M", requiredCerts: ["OEKO-TEX", "GOTS"], supplierAuditRequired: false },
  { id: "CUSTOMER#ZALANDO", name: "Zalando", requiredCerts: ["REACH", "OEKO-TEX"], supplierAuditRequired: false },
  { id: "CUSTOMER#WALMART", name: "Walmart", requiredCerts: ["CPSIA", "BSCI"], supplierAuditRequired: true },
];

export const COUNTRIES: Country[] = [
  { code: "GERMANY", name: "Germany", requiredRules: ["REACH", "GPSR"] },
  { code: "FRANCE", name: "France", requiredRules: ["REACH", "GPSR"] },
  { code: "UK", name: "United Kingdom", requiredRules: ["UKCA", "GPSR"] },
  { code: "USA", name: "United States", requiredRules: ["CPSIA", "GPSR"] },
];

export const PRODUCTS: Product[] = [
  {
    id: "PRODUCT#P-100",
    name: "EcoRun Running Shirt",
    category: "Textile / Sportswear",
    supplierId: "SUP#ABC",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-02-01", expiresAt: "2027-02-01" },
      { type: "REACH", issuer: "TUV Rheinland", issuedAt: "2025-01-15", expiresAt: "2027-01-15" },
      { type: "GPSR", issuer: "TUV Rheinland", issuedAt: "2025-04-01", expiresAt: "2027-04-01" },
    ],
  },
  {
    id: "PRODUCT#P-200",
    name: "Basic Cotton Tee",
    category: "Textile / Basics",
    supplierId: "SUP#XYZ",
    certificates: [
      { type: "REACH", issuer: "SGS", issuedAt: "2025-03-01", expiresAt: "2027-03-01" },
    ],
  },
  {
    id: "PRODUCT#P-101",
    name: "TrailPro Hiking Pants",
    category: "Textile / Outdoor",
    supplierId: "SUP#NOR",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-05-01", expiresAt: "2027-05-01" },
      { type: "REACH", issuer: "SGS", issuedAt: "2025-05-01", expiresAt: "2027-05-01" },
      { type: "GPSR", issuer: "SGS", issuedAt: "2025-06-01", expiresAt: "2027-06-01" },
      { type: "GOTS", issuer: "Control Union", issuedAt: "2025-04-10", expiresAt: "2026-04-10" },
    ],
  },
  {
    id: "PRODUCT#P-102",
    name: "AquaSwim Swim Goggles",
    category: "Hardgoods / Swim",
    supplierId: "SUP#GLO",
    certificates: [
      { type: "REACH", issuer: "SGS", issuedAt: "2025-01-20", expiresAt: "2027-01-20" },
      { type: "GPSR", issuer: "SGS", issuedAt: "2025-02-20", expiresAt: "2027-02-20" },
    ],
  },
  {
    id: "PRODUCT#P-103",
    name: "Tactical Field Jacket",
    category: "Textile / Tactical",
    supplierId: "SUP#TAC",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-03-15", expiresAt: "2027-03-15" },
      { type: "REACH", issuer: "TUV", issuedAt: "2025-03-15", expiresAt: "2027-03-15" },
      { type: "GPSR", issuer: "TUV", issuedAt: "2025-03-15", expiresAt: "2027-03-15" },
      { type: "ISO9001", issuer: "DQS", issuedAt: "2025-01-01", expiresAt: "2028-01-01" },
    ],
  },
  {
    id: "PRODUCT#P-104",
    name: "YogaFlex Leggings",
    category: "Textile / Sportswear",
    supplierId: "SUP#ABC",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-06-01", expiresAt: "2027-06-01" },
      { type: "REACH", issuer: "TUV Rheinland", issuedAt: "2025-06-01", expiresAt: "2027-06-01" },
      { type: "GPSR", issuer: "TUV Rheinland", issuedAt: "2025-07-01", expiresAt: "2027-07-01" },
      { type: "GOTS", issuer: "Control Union", issuedAt: "2025-05-01", expiresAt: "2027-05-01" },
    ],
  },
  {
    id: "PRODUCT#P-105",
    name: "CampStove Portable Burner",
    category: "Hardgoods / Camping",
    supplierId: "SUP#GLO",
    certificates: [
      { type: "GPSR", issuer: "Intertek", issuedAt: "2025-08-01", expiresAt: "2027-08-01" },
      { type: "CE", issuer: "Intertek", issuedAt: "2025-07-15", expiresAt: "2027-07-15" },
    ],
  },
  {
    id: "PRODUCT#P-106",
    name: "KidsPlay Soccer Ball",
    category: "Hardgoods / Kids",
    supplierId: "SUP#XYZ",
    certificates: [
      { type: "REACH", issuer: "SGS", issuedAt: "2024-06-01", expiresAt: "2026-06-01" },
      { type: "CPSIA", issuer: "SGS", issuedAt: "2024-06-01", expiresAt: "2026-06-01" },
      { type: "BSCI", issuer: "amfori", issuedAt: "2025-01-01", expiresAt: "2027-01-01" },
    ],
  },
  {
    id: "PRODUCT#P-107",
    name: "FitTrack Sports Watch",
    category: "Electronics / Wearables",
    supplierId: "SUP#GLO",
    certificates: [
      { type: "GPSR", issuer: "Intertek", issuedAt: "2025-09-01", expiresAt: "2027-09-01" },
      { type: "CE", issuer: "Intertek", issuedAt: "2025-09-01", expiresAt: "2027-09-01" },
      { type: "UKCA", issuer: "Intertek", issuedAt: "2025-09-01", expiresAt: "2027-09-01" },
    ],
  },
  {
    id: "PRODUCT#P-108",
    name: "Urban Commuter Backpack",
    category: "Softgoods / Bags",
    supplierId: "SUP#XYZ",
    certificates: [
      { type: "REACH", issuer: "SGS", issuedAt: "2024-05-01", expiresAt: "2026-05-01" },
      { type: "GPSR", issuer: "SGS", issuedAt: "2024-05-01", expiresAt: "2026-05-01" },
    ],
  },
  {
    id: "PRODUCT#P-109",
    name: "Organic Cotton Hoodie",
    category: "Textile / Basics",
    supplierId: "SUP#ABC",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-10-01", expiresAt: "2027-10-01" },
      { type: "REACH", issuer: "TUV Rheinland", issuedAt: "2025-10-01", expiresAt: "2027-10-01" },
      { type: "GPSR", issuer: "TUV Rheinland", issuedAt: "2025-10-01", expiresAt: "2027-10-01" },
      { type: "GOTS", issuer: "Control Union", issuedAt: "2025-09-15", expiresAt: "2027-09-15" },
    ],
  },
  {
    id: "PRODUCT#P-110",
    name: "ProTec Bike Helmet",
    category: "Hardgoods / Cycling",
    supplierId: "SUP#NOR",
    certificates: [
      { type: "GPSR", issuer: "SGS", issuedAt: "2025-04-01", expiresAt: "2027-04-01" },
      { type: "CE", issuer: "SGS", issuedAt: "2025-03-01", expiresAt: "2027-03-01" },
      { type: "UKCA", issuer: "SGS", issuedAt: "2025-03-01", expiresAt: "2027-03-01" },
    ],
  },
  {
    id: "PRODUCT#P-111",
    name: "SnowPeak Ski Gloves",
    category: "Textile / Winter",
    supplierId: "SUP#NOR",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-11-01", expiresAt: "2027-11-01" },
      { type: "REACH", issuer: "SGS", issuedAt: "2025-11-01", expiresAt: "2027-11-01" },
      { type: "GPSR", issuer: "SGS", issuedAt: "2025-11-01", expiresAt: "2027-11-01" },
    ],
  },
  {
    id: "PRODUCT#P-112",
    name: "MilSpec Combat Boots",
    category: "Footwear / Tactical",
    supplierId: "SUP#TAC",
    certificates: [
      { type: "REACH", issuer: "TUV", issuedAt: "2025-02-01", expiresAt: "2027-02-01" },
      { type: "GPSR", issuer: "TUV", issuedAt: "2025-02-01", expiresAt: "2027-02-01" },
      { type: "ISO9001", issuer: "DQS", issuedAt: "2025-02-01", expiresAt: "2028-02-01" },
    ],
  },
  {
    id: "PRODUCT#P-113",
    name: "AeroDry Gym Towel",
    category: "Textile / Accessories",
    supplierId: "SUP#GLO",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-08-15", expiresAt: "2027-08-15" },
      { type: "REACH", issuer: "SGS", issuedAt: "2025-08-15", expiresAt: "2027-08-15" },
      { type: "GPSR", issuer: "SGS", issuedAt: "2025-08-15", expiresAt: "2027-08-15" },
      { type: "BSCI", issuer: "amfori", issuedAt: "2025-07-01", expiresAt: "2027-07-01" },
    ],
  },
  {
    id: "PRODUCT#P-114",
    name: "HomeGym Dumbbell Set",
    category: "Hardgoods / Fitness",
    supplierId: "SUP#XYZ",
    certificates: [
      { type: "REACH", issuer: "SGS", issuedAt: "2025-01-01", expiresAt: "2027-01-01" },
      { type: "GPSR", issuer: "SGS", issuedAt: "2025-01-01", expiresAt: "2027-01-01" },
      { type: "CPSIA", issuer: "SGS", issuedAt: "2025-01-01", expiresAt: "2027-01-01" },
    ],
  },
  {
    id: "PRODUCT#P-115",
    name: "RunLite Reflective Vest",
    category: "Textile / Safety",
    supplierId: "SUP#ABC",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-05-20", expiresAt: "2027-05-20" },
      { type: "REACH", issuer: "TUV Rheinland", issuedAt: "2025-05-20", expiresAt: "2027-05-20" },
      { type: "GPSR", issuer: "TUV Rheinland", issuedAt: "2025-05-20", expiresAt: "2027-05-20" },
    ],
  },
  {
    id: "PRODUCT#P-116",
    name: "TrekLite Sleeping Bag",
    category: "Textile / Outdoor",
    supplierId: "SUP#NOR",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2024-01-10", expiresAt: "2026-01-10" },
      { type: "REACH", issuer: "SGS", issuedAt: "2024-01-10", expiresAt: "2026-01-10" },
      { type: "GPSR", issuer: "SGS", issuedAt: "2024-01-10", expiresAt: "2026-01-10" },
    ],
  },
  {
    id: "PRODUCT#P-117",
    name: "StreetBall Basketball",
    category: "Hardgoods / Sport",
    supplierId: "SUP#GLO",
    certificates: [
      { type: "GPSR", issuer: "Intertek", issuedAt: "2025-03-01", expiresAt: "2027-03-01" },
    ],
  },
  {
    id: "PRODUCT#P-118",
    name: "EcoFit Yoga Mat",
    category: "Softgoods / Yoga",
    supplierId: "SUP#ABC",
    certificates: [
      { type: "OEKO-TEX", issuer: "Hohenstein", issuedAt: "2025-04-15", expiresAt: "2027-04-15" },
      { type: "REACH", issuer: "TUV Rheinland", issuedAt: "2025-04-15", expiresAt: "2027-04-15" },
      { type: "GPSR", issuer: "TUV Rheinland", issuedAt: "2025-04-15", expiresAt: "2027-04-15" },
      { type: "GOTS", issuer: "Control Union", issuedAt: "2025-04-15", expiresAt: "2027-04-15" },
    ],
  },
];

export function findProduct(productId: string): Product | undefined {
  const normalized = productId.trim().toUpperCase().replace(/^P(\d)/, "P-$1");
  return (
    PRODUCTS.find((p) => p.id === `PRODUCT#${normalized}`) ??
    PRODUCTS.find((p) => p.id === productId.trim().toUpperCase())
  );
}

export function findCustomer(customer: string): Customer | undefined {
  const key = customer.trim().toUpperCase();
  return CUSTOMERS.find((c) => c.id === `CUSTOMER#${key}` || c.name.toUpperCase() === key);
}

export function findCountry(country: string): Country | undefined {
  const key = country.trim().toUpperCase();
  return COUNTRIES.find(
    (c) => c.code === key || c.name.toUpperCase() === key || c.name.toUpperCase().startsWith(key)
  );
}

export function findSupplier(supplierId: string): Supplier | undefined {
  return SUPPLIERS.find((s) => s.id === supplierId);
}
