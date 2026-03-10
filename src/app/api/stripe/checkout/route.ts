import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { isValidEmail, isValidPackSize, sanitizeEmail, sanitizeName } from "@/lib/validation";

// Lazily initialise Stripe to avoid crashing at module-load time if env is missing
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function getPriceId(packSize: number): string {
  const ids: Record<number, string | undefined> = {
    5: process.env.STRIPE_PRICE_ID_PACK5,
    10: process.env.STRIPE_PRICE_ID_PACK10,
  };
  const id = ids[packSize];
  if (!id) throw new Error(`No price ID configured for pack size ${packSize}`);
  return id;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido" }, { status: 400 });
  }

  const { name: rawName, email: rawEmail, packSize } = body as Record<string, unknown>;

  if (!isValidEmail(rawEmail)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (typeof rawName !== "string" || !rawName.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  if (!isValidPackSize(packSize)) {
    return NextResponse.json({ error: "Pack no válido" }, { status: 400 });
  }

  const email = sanitizeEmail(rawEmail);
  const name = sanitizeName(rawName);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("[checkout] NEXT_PUBLIC_BASE_URL is not set");
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const priceId = getPriceId(packSize);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        student_name: name,
        student_email: email,
        pack_size: String(packSize),
      },
      // NOTE: sensitive data (email, name) carried in metadata only, NOT in URL
      // The success page reads them from the Stripe session via session_id
      success_url: `${baseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json({ error: "Error al crear la sesión de pago" }, { status: 500 });
  }
}
