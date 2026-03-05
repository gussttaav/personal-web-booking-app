import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<number, string> = {
  5: process.env.STRIPE_PRICE_ID_PACK5!,
  10: process.env.STRIPE_PRICE_ID_PACK10!,
};

export async function POST(req: NextRequest) {
  const { name, email, packSize } = await req.json();

  if (!name || !email || ![5, 10].includes(packSize)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const priceId = PRICE_IDS[packSize as 5 | 10];
  if (!priceId) {
    return NextResponse.json({ error: "Pack no encontrado" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

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
    success_url: `${baseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&pack=${packSize}`,
    cancel_url: `${baseUrl}/?cancelled=true`,
  });

  return NextResponse.json({ url: session.url });
}
