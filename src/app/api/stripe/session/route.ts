import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

/**
 * GET /api/stripe/session?session_id=cs_xxx
 *
 * Returns the student metadata from a completed Stripe session.
 * This keeps PII (email, name) out of URL parameters.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "session_id inválido" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Pago no completado" }, { status: 402 });
    }

    const email = session.metadata?.student_email ?? session.customer_email ?? "";
    const name = session.metadata?.student_name ?? "";
    const packSize = parseInt(session.metadata?.pack_size ?? "0", 10);

    if (!email) {
      return NextResponse.json({ error: "Datos de sesión incompletos" }, { status: 400 });
    }

    return NextResponse.json({ email, name, packSize });
  } catch (err) {
    console.error("[session] Error retrieving session:", err);
    return NextResponse.json({ error: "Error al recuperar la sesión" }, { status: 500 });
  }
}
