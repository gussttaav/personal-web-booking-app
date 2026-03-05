import { NextRequest, NextResponse } from "next/server";
import { getCredits } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const result = await getCredits(email);
    return NextResponse.json({
      credits: result?.credits || 0,
      name: result?.name || "",
    });
  } catch (err) {
    console.error("Error checking credits:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
