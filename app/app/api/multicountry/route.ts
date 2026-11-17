import { NextRequest, NextResponse } from "next/server";
import { compareCountries } from "@/lib/engine";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body?.productId;
  const customer = body?.customer;

  if (typeof productId !== "string" || typeof customer !== "string") {
    return NextResponse.json(
      { error: "Request body must include string fields: productId, customer." },
      { status: 400 }
    );
  }

  const comparison = compareCountries(productId, customer);
  return NextResponse.json({ productId, customer, comparison });
}
