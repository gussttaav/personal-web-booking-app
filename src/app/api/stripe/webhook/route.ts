import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addOrUpdateStudent } from "@/lib/sheets";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

// Required: disable body parsing so we can verify the raw signature
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.metadata?.student_email ?? session.customer_email ?? "";
    const name = session.metadata?.student_name ?? "";
    const packSize = parseInt(session.metadata?.pack_size ?? "0", 10);

    if (!email || !packSize) {
      console.error("[webhook] Missing metadata:", { email, name, packSize });
      // Return 200 to prevent Stripe retries for bad data
      return NextResponse.json({ received: true, warning: "Missing metadata" });
    }

    try {
      await addOrUpdateStudent(email, name, packSize, `Pack ${packSize} clases`);
      console.info(`[webhook] Credits added: ${email} +${packSize}`);
    } catch (err) {
      console.error("[webhook] Error updating sheet:", err);
      // Return 500 so Stripe will retry
      return NextResponse.json({ error: "Sheet update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
