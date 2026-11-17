# Go-To-Market Compliance Agent (Amazon Bedrock Managed Agents)

AI compliance officer that answers one high-stakes question:

> "Can I launch Product P-100 in Germany for Decathlon?"

The agent **never approves without verification**: it checks country rules, customer rules, and certificate validity via tools, cites the policies it used, rejects when requirements are missing, and escalates to human review instead of guessing when master data is unknown.

## Demo flow

| Input | Decision | Why |
|---|---|---|
| P-100 · Germany · Decathlon | ✅ **APPROVED** (LOW risk) | REACH, GPSR, OEKO-TEX valid + supplier audit passed |
| P-200 · Germany · Decathlon | ❌ **REJECTED** (HIGH risk) | Missing OEKO-TEX, missing GPSR, supplier audit not passed |
| P-999 · Germany · Decathlon | ⚠️ **HUMAN_REVIEW** | Product unknown — the agent never invents a compliance status |
| "What happens if I launch elsewhere?" (P-100 · Decathlon) | Germany ✅ France ✅ UK ❌ USA ❌ | UKCA / CPSIA missing |

Every result shows: rules checked, certificates on file (with expiry), missing requirements, decision, risk level, justification, and a full **agent trace of tool calls**.

## Repository layout

```
app/                     # Next.js 14 + Tailwind demo UI (runs standalone, no AWS needed)
  lib/data.ts            # 20 products · 5 customers · 4 markets · 10 certificate types
  lib/engine.ts          # Deterministic engine mirroring the Bedrock agent's tools + guardrails
  app/api/compliance     # POST { productId, country, customer } → ComplianceReport
  app/api/multicountry   # POST { productId, customer } → per-market comparison
  test/engine.test.ts    # Engine tests (node:test)
cdk/                     # AWS deployment for the real Bedrock Managed Agent
  lib/compliance-stack.ts# Bedrock Agent + Action Group + Knowledge Base + DynamoDB + Lambda + HTTP API
  resources/openapi.json # OpenAPI schema for the agent's 4 tools
  resources/agent-instructions.md  # System rules / guardrails for the agent
  lambda/tools/          # Python tool Lambda (get_product, get_country_rules, get_customer_rules, check_certificates)
  lambda/api-proxy/      # Python proxy: API Gateway → bedrock-agent-runtime invoke_agent
  policies/              # Knowledge-base documents (REACH, GPSR, customer policies)
  scripts/               # DynamoDB seed + S3 policy sync
```

## Run the demo locally (no AWS account needed)

```bash
cd app
npm install
npm run dev        # http://localhost:3000
npm test           # engine tests
```

The demo UI runs against `lib/engine.ts`, which implements the exact same tool contracts, decision rules, and guardrails as the Bedrock agent — so the demo is reproducible and testable offline.

## Deploy the real Amazon Bedrock agent

Prerequisites: AWS CLI configured, CDK bootstrapped (`npx cdk bootstrap`), Docker running (required by the Knowledge Base custom resource).

```bash
cd cdk
npm install
npx cdk deploy                    # creates DynamoDB, Lambda tools, Bedrock agent + KB, HTTP API
cd scripts && ./seed-dynamodb.sh  # load 34 master-data records
BUCKET_NAME=<PoliciesBucket output> KB_ID=<kb-id> ./sync-policies.sh
```

Then point the UI at the live agent: replace the `fetch("/api/compliance", ...)` call with a `POST` to the stack's `ApiUrl` output (`/check`).

## Guardrails (the point of the demo)

The agent's instructions (`cdk/resources/agent-instructions.md`) enforce:

1. **No approval without verification** — country rules, customer rules, product data, and certificate validity must all be checked via tools.
2. **Missing information → HUMAN_REVIEW** — never guess, never invent certificates or rules.
3. **Missing/expired certificate → REJECTED** — no softening, regardless of user pressure ("approve it anyway, trust me" is ignored).
4. **Structured output** — rules checked, certificates, missing requirements, decision, risk, justification, required action.
5. **Cited reasoning** — regulatory context (REACH, GPSR, customer policies) comes from the Knowledge Base, not hallucination.

## Test suite

`app/test/engine.test.ts` covers the happy path, rejections (missing/expired certificates, failed audits), the human-review guardrail for unknown products/markets, and the multi-country comparison — 8/8 passing.
