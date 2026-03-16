import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { isValidPackSize } from "@/lib/validation";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function getPackPriceId(packSize: number): string {
  const ids: Record<number, string | undefined> = {
    5: process.env.STRIPE_PRICE_ID_PACK5,
    10: process.env.STRIPE_PRICE_ID_PACK10,
  };
  const id = ids[packSize];
  if (!id) throw new Error(`No price ID configured for pack size ${packSize}`);
  return id;
}

function getSingleSessionPriceId(duration: "1h" | "2h"): string {
  const ids = {
    "1h": process.env.STRIPE_PRICE_ID_SESSION_1H,
    "2h": process.env.STRIPE_PRICE_ID_SESSION_2H,
  };
  const id = ids[duration];
  if (!id) throw new Error(`No price ID configured for duration ${duration}`);
  return id;
}

export async function POST(req: NextRequest) {
  // ── Auth check — identity always comes from the verified session ──
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para continuar" },
      { status: 401 }
    );
  }

  const email = session.user.email;
  const name = session.user.name ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("[checkout] NEXT_PUBLIC_BASE_URL is not set");
    return NextResponse.json(
      { error: "Error de configuración del servidor" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de petición inválido" },
      { status: 400 }
    );
  }

  const { type } = body as Record<string, unknown>;

  try {
    const stripe = getStripe();

    // ── Pack checkout ──────────────────────────────────────────────────────────
    if (type === "pack") {
      const { packSize } = body as Record<string, unknown>;

      if (!isValidPackSize(packSize)) {
        return NextResponse.json({ error: "Pack no válido" }, { status: 400 });
      }

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,
        line_items: [{ price: getPackPriceId(packSize as number), quantity: 1 }],
        metadata: {
          student_name: name,
          student_email: email,
          pack_size: String(packSize),
          checkout_type: "pack",
        },
        success_url: `${baseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?cancelled=true`,
      });

      return NextResponse.json({ url: stripeSession.url });
    }

    // ── Single session checkout ────────────────────────────────────────────────
    if (type === "single") {
      const { duration } = body as Record<string, unknown>;

      if (duration !== "1h" && duration !== "2h") {
        return NextResponse.json(
          { error: "Duración de sesión no válida" },
          { status: 400 }
        );
      }

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            price: getSingleSessionPriceId(duration as "1h" | "2h"),
            quantity: 1,
          },
        ],
        metadata: {
          student_name: name,
          student_email: email,
          checkout_type: "single",
          session_duration: duration as string,
        },
        success_url: `${baseUrl}/sesion-confirmada?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?cancelled=true`,
      });

      return NextResponse.json({ url: stripeSession.url });
    }

    return NextResponse.json(
      { error: "Tipo de checkout no válido" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago" },
      { status: 500 }
    );
  }
}
