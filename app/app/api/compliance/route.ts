import { NextRequest, NextResponse } from "next/server";
import { runComplianceCheck } from "@/lib/engine";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body?.productId;
  const country = body?.country;
  const customer = body?.customer;

  if (typeof productId !== "string" || typeof country !== "string" || typeof customer !== "string") {
    return NextResponse.json(
      { error: "Request body must include string fields: productId, country, customer." },
      { status: 400 }
    );
  }

  const report = runComplianceCheck(productId, country, customer);
  return NextResponse.json(report);
}
