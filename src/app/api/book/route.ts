import { NextRequest, NextResponse } from "next/server";
import { decrementCredit } from "@/lib/sheets";
import { isValidEmail, sanitizeEmail } from "@/lib/validation";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido" }, { status: 400 });
  }

  const { email: rawEmail } = body as Record<string, unknown>;

  if (!isValidEmail(rawEmail)) {
    return NextResponse.json({ error: "Email requerido y válido" }, { status: 400 });
  }

  const email = sanitizeEmail(rawEmail);

  try {
    const result = await decrementCredit(email);
    if (!result.ok) {
      return NextResponse.json({ error: "Sin créditos disponibles" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, remaining: result.remaining });
  } catch (err) {
    console.error("[book] Error decrementing credit:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
