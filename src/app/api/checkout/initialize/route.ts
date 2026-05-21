import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, amount, event_id, ticket_type_name, quantity, user_id, guest_name } = await req.json();

    if (!email || !amount || !event_id || !ticket_type_name || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate a secure unique reference
    const reference = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Store metadata in payment_channel
    const metadata = {
      email: email.toLowerCase(),
      ticket_type_name,
      quantity: Number(quantity),
      guest_name: guest_name || null,
      user_id: user_id || null
    };

    // Calculate platform fee and vendor net
    const { data: eventData } = await supabase
      .from("events")
      .select("absorb_fees")
      .eq("id", event_id)
      .single();

    const absorbFees = eventData?.absorb_fees || false;

    let platformFeePercent = 4.0;
    let zeroFeeMode = false;
    const { data: configData } = await supabase
      .from("system_configurations")
      .select("value")
      .eq("key", "platform_markup")
      .maybeSingle();

    if (configData?.value) {
      const val = configData.value as { percentage?: number; zero_fee_mode?: boolean };
      platformFeePercent = val.percentage ?? 4.0;
      zeroFeeMode = val.zero_fee_mode ?? false;
    }

    if (zeroFeeMode) {
      platformFeePercent = 0.0;
    }

    const F = platformFeePercent / 100;
    let platform_fee = 0;
    let vendor_net = amount;

    if (F > 0) {
      if (absorbFees) {
        platform_fee = amount * F;
        vendor_net = amount - platform_fee;
      } else {
        vendor_net = amount / (1 + F);
        platform_fee = amount - vendor_net;
      }
    }

    const { error } = await supabase
      .from("transactions")
      .insert({
        reference,
        buyer_id: user_id && user_id !== "guest_pending" ? user_id : null,
        event_id,
        amount: Number(amount.toFixed(2)),
        platform_fee: Number(platform_fee.toFixed(2)),
        vendor_net: Number(vendor_net.toFixed(2)),
        status: "pending",
        payment_channel: JSON.stringify(metadata)
      });

    if (error) {
      console.error("Initialize Transaction Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reference });
  } catch (err: unknown) {
    console.error("Initialize checkout error:", err);
    return NextResponse.json({ error: (err as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
