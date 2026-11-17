"use client";

import { FormEvent, useState } from "react";
import { ComplianceReport, CountryComparison } from "@/lib/engine";

const decisionBadge = (decision: string) =>
  decision === "APPROVED"
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
    : decision === "REJECTED"
      ? "bg-red-500/15 text-red-400 border-red-500/40"
      : "bg-amber-500/15 text-amber-400 border-amber-500/40";

const riskBadge = (risk: string) =>
  risk === "LOW"
    ? "bg-emerald-500/10 text-emerald-300"
    : risk === "MEDIUM"
      ? "bg-amber-500/10 text-amber-300"
      : "bg-red-500/10 text-red-300";

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-emerald-400 font-bold">✓</span>
  ) : (
    <span className="text-red-400 font-bold">✗</span>
  );
}

export default function Home() {
  const [productId, setProductId] = useState("P-100");
  const [country, setCountry] = useState("Germany");
  const [customer, setCustomer] = useState("Decathlon");
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [comparison, setComparison] = useState<CountryComparison[] | null>(null);
  const [loading, setLoading] = useState<"check" | "compare" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck(e: FormEvent) {
    e.preventDefault();
    setLoading("check");
    setError(null);
    setComparison(null);
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, country, customer }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setReport(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(null);
    }
  }

  async function runComparison() {
    setLoading("compare");
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/multicountry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customer }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium text-orange-400 tracking-widest uppercase">Amazon Bedrock Managed Agents</p>
        <h1 className="mt-2 text-3xl font-bold">Go-To-Market Compliance Agent</h1>
        <p className="mt-2 text-slate-400">
          &quot;Can I launch this product in this market for this customer?&quot; — The agent verifies country rules,
          customer rules, and certificates before it ever approves. It never invents a compliance status.
        </p>
      </header>

      <form onSubmit={runCheck} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Product</span>
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="P-100"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Target Market</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
            >
              <option>Germany</option>
              <option>France</option>
              <option>United Kingdom</option>
              <option>United States</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Customer</span>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
            >
              <option>Decathlon</option>
              <option>Bundeswehr</option>
              <option>H&amp;M</option>
              <option>Zalando</option>
              <option>Walmart</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading !== null}
            className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-orange-400 disabled:opacity-50"
          >
            {loading === "check" ? "Checking…" : "Run Compliance Check"}
          </button>
          <button
            type="button"
            onClick={runComparison}
            disabled={loading !== null}
            className="rounded-lg border border-slate-600 px-5 py-2.5 font-semibold text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {loading === "compare" ? "Comparing markets…" : "What happens if I launch elsewhere?"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">{error}</div>
      )}

      {report && (
        <section className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-4 py-1.5 text-lg font-bold ${decisionBadge(report.decision)}`}>
              {report.decision}
            </span>
            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${riskBadge(report.riskLevel)}`}>
              Risk: {report.riskLevel}
            </span>
            {report.product && (
              <span className="text-sm text-slate-400">
                {report.product.id} · {report.product.name} · Supplier: {report.product.supplier} → {report.market} · {report.customer}
              </span>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 font-semibold text-slate-200">Rules Checked</h2>
              <ul className="space-y-1.5 text-sm text-slate-300">
                {report.rulesChecked.length === 0 && <li className="text-slate-500">No rules could be verified.</li>}
                {report.checks.map((c) => (
                  <li key={`${c.source}-${c.requirement}`} className="flex items-start gap-2">
                    <CheckIcon ok={c.status === "PASS"} />
                    <span>
                      <span className="font-medium">{c.requirement}</span>
                      <span className="ml-2 text-xs text-slate-500">({c.source})</span>
                      <span className="block text-xs text-slate-500">{c.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 font-semibold text-slate-200">Certificates on File</h2>
              {report.certificatesPresent.length === 0 ? (
                <p className="text-sm text-slate-500">No certificates on file.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {report.certificatesPresent.map((c) => (
                      <tr key={c.type} className="border-b border-slate-800 last:border-0">
                        <td className="py-1.5 font-medium text-slate-200">{c.type}</td>
                        <td className="py-1.5 text-slate-400">{c.issuer}</td>
                        <td className={`py-1.5 text-right ${c.valid ? "text-slate-400" : "text-red-400 font-medium"}`}>
                          {c.valid ? `valid → ${c.expiresAt}` : `EXPIRED ${c.expiresAt}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {report.missingRequirements.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <h2 className="mb-2 font-semibold text-red-300">Missing Requirements</h2>
              <ul className="list-disc pl-5 text-sm text-red-200/90 space-y-1">
                {report.missingRequirements.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              {report.requiredAction && (
                <p className="mt-3 text-sm text-red-200"><span className="font-semibold">Required action:</span> {report.requiredAction}</p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="mb-2 font-semibold text-slate-200">Justification</h2>
            <p className="text-sm text-slate-300">{report.justification}</p>
          </div>

          <details className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <summary className="cursor-pointer font-semibold text-slate-300">Agent Trace — Tool Calls (Bedrock Agent Action Group)</summary>
            <ol className="mt-3 space-y-2 text-sm text-slate-400">
              {report.toolCalls.map((t, i) => (
                <li key={i}>
                  <span className="font-mono text-orange-400">{t.tool}</span>({JSON.stringify(t.input)}) → {t.summary}
                </li>
              ))}
            </ol>
          </details>
        </section>
      )}

      {comparison && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-200">
            Market Comparison for {productId} · {customer}
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.country} className="border-t border-slate-800 bg-slate-900/40">
                    <td className="px-4 py-3 font-medium text-slate-200">{row.country}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${decisionBadge(row.decision)}`}>
                        {row.decision === "APPROVED" ? "✅ " : row.decision === "REJECTED" ? "❌ " : "⚠️ "}
                        {row.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {row.missingRequirements.length > 0
                        ? `Missing: ${row.missingRequirements.map((m) => m.split(" (")[0]).join(", ")}`
                        : "All requirements satisfied."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
        Demo data: 20 products · 5 customers · 4 markets · 10 certificate types. This UI runs against a deterministic
        engine that mirrors the Bedrock agent&apos;s tools and guardrails; deploy the CDK stack in <code>/cdk</code> to
        switch to the live Amazon Bedrock Managed Agent.
      </footer>
    </main>
  );
}
