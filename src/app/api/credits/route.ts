import { NextRequest, NextResponse } from "next/server";
import { getCredits } from "@/lib/sheets";
import { isValidEmail, sanitizeEmail } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("email");

  if (!isValidEmail(raw)) {
    return NextResponse.json({ error: "Email requerido y válido" }, { status: 400 });
  }

  const email = sanitizeEmail(raw);

  try {
    const result = await getCredits(email);
    return NextResponse.json({
      credits: result?.credits ?? 0,
      name: result?.name ?? "",
    });
  } catch (err) {
    console.error("[credits] Error fetching credits:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
