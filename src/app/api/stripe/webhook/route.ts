import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addOrUpdateStudent } from "@/lib/sheets";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.CheckoutSession;

    const email = session.metadata?.student_email || session.customer_email || "";
    const name = session.metadata?.student_name || "";
    const packSize = parseInt(session.metadata?.pack_size || "0", 10);

    if (!email || !packSize) {
      console.error("Missing metadata:", session.metadata);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const packLabel = `Pack ${packSize} clases`;

    try {
      await addOrUpdateStudent(email, name, packSize, packLabel);
      console.log(`✅ Credits added: ${email} → +${packSize} credits`);
    } catch (err) {
      console.error("Error updating sheet:", err);
      return NextResponse.json({ error: "Sheet error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// Required: disable body parsing for Stripe webhook verification
export const config = {
  api: { bodyParser: false },
};
