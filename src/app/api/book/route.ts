import { NextRequest, NextResponse } from "next/server";
import { decrementCredit } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const result = await decrementCredit(email);
    if (!result.ok) {
      return NextResponse.json({ error: "Sin créditos disponibles" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, remaining: result.remaining });
  } catch (err) {
    console.error("Error decrementing credit:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
