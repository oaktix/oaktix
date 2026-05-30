import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, amount, event_id, ticket_type_name, quantity, user_id, guest_name, coupon_code } = await req.json();

    if (!email || !amount || !event_id || !ticket_type_name || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch Event and verify Organizer & Ticket Type
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 400 });
    }

    const ticketTypes = event.ticket_types || [];
    const tier = ticketTypes.find((t: any) => t.name === ticket_type_name);
    if (!tier) {
      return NextResponse.json({ error: "Selected ticket tier does not exist for this event" }, { status: 400 });
    }

    // 2. Check if manually closed
    if (tier.is_closed) {
      return NextResponse.json({ error: "This ticket tier is sold out" }, { status: 400 });
    }

    // 3. Fetch sold count for the tier
    const { count: soldCount, error: countError } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event_id)
      .in("status", ["active", "used"])
      .filter("ticket_type->>name", "eq", ticket_type_name);

    if (countError) {
      console.error("Count ticket error:", countError);
    }
    const currentSoldCount = soldCount || 0;

    // 4. Check regular capacity limits
    if (tier.capacity !== undefined && tier.capacity !== null && Number(tier.capacity) > 0) {
      const remaining = Number(tier.capacity) - currentSoldCount;
      if (Number(quantity) > remaining) {
        return NextResponse.json({ error: `Not enough tickets remaining. Only ${remaining} left.` }, { status: 400 });
      }
    }

    // 5. Determine effective price and check early bird limits
    let effectivePrice = Number(tier.price);
    const now = new Date();
    
    const isEarlyBirdConfigured = tier.early_bird_price !== undefined && tier.early_bird_price !== null;
    const isExpiredByDate = tier.early_bird_until ? new Date(tier.early_bird_until) < now : false;
    const hasCapacityLeft = tier.early_bird_capacity ? currentSoldCount < tier.early_bird_capacity : true;
    
    if (isEarlyBirdConfigured && !isExpiredByDate && hasCapacityLeft) {
      // Early bird is active
      const earlyBirdRemaining = tier.early_bird_capacity ? Math.max(0, tier.early_bird_capacity - currentSoldCount) : 999;
      if (Number(quantity) > earlyBirdRemaining) {
        return NextResponse.json({ error: `Requested quantity exceeds remaining early bird capacity. Only ${earlyBirdRemaining} early bird tickets left.` }, { status: 400 });
      }
      effectivePrice = Number(tier.early_bird_price);
    }

    // 6. Calculate base pricing
    const originalSubtotal = effectivePrice * Number(quantity);

    // 6. Validate coupon (if provided) and calculate discount
    let discount = 0;
    let validatedCouponCode = null;

    if (coupon_code) {
      const normalizedCode = coupon_code.trim().toUpperCase();
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (!coupon) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }

      // Check dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return NextResponse.json({ error: "Coupon is not yet active" }, { status: 400 });
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
      }

      // Check usage limits
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        return NextResponse.json({ error: "Coupon limit reached" }, { status: 400 });
      }

      // Check scope
      let isApplicable = false;
      if (coupon.event_id) {
        isApplicable = coupon.event_id === event_id;
      } else {
        const { data: creator } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", coupon.creator_id)
          .single();

        if (creator) {
          if (creator.role === "admin" || creator.role === "super_admin") {
            isApplicable = true;
          } else if (creator.role === "vendor" && coupon.creator_id === event.organizer_id) {
            isApplicable = true;
          }
        }
      }

      if (!isApplicable) {
        return NextResponse.json({ error: "Coupon not applicable to this event" }, { status: 400 });
      }

      // Calculate discount value
      if (coupon.discount_type === "percentage") {
        discount = originalSubtotal * (Number(coupon.discount_value) / 100);
      } else if (coupon.discount_type === "fixed") {
        discount = Number(coupon.discount_value);
      }

      discount = Math.min(discount, originalSubtotal);
      discount = Number(discount.toFixed(2));
      validatedCouponCode = coupon.code;
    }

    const discountedSubtotal = originalSubtotal - discount;

    // 7. Calculate expected platform fee and vendor net
    const absorbFees = event.absorb_fees || false;

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
    let vendor_net = discountedSubtotal;
    let expectedTotalAmount = discountedSubtotal;

    if (F > 0) {
      if (absorbFees) {
        // Grand total is just the ticket cost. Fees are deducted from vendor payout
        expectedTotalAmount = discountedSubtotal;
        platform_fee = discountedSubtotal * F;
        vendor_net = discountedSubtotal - platform_fee;
      } else {
        // Grand total is ticket cost + service fee
        platform_fee = discountedSubtotal * F;
        expectedTotalAmount = discountedSubtotal + platform_fee;
        vendor_net = discountedSubtotal;
      }
    }

    // Check for price tampering
    if (Math.abs(expectedTotalAmount - Number(amount)) > 0.05) {
      return NextResponse.json({ error: "Transaction amount mismatch. Please reload checkout." }, { status: 400 });
    }

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

    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        reference,
        buyer_id: user_id && user_id !== "guest_pending" ? user_id : null,
        event_id,
        amount: Number(amount.toFixed(2)),
        platform_fee: Number(platform_fee.toFixed(2)),
        vendor_net: Number(vendor_net.toFixed(2)),
        status: "pending",
        payment_channel: JSON.stringify(metadata),
        coupon_code: validatedCouponCode,
        discount_amount: discount
      });

    if (txError) {
      console.error("Initialize Transaction Error:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reference });
  } catch (err: unknown) {
    console.error("Initialize checkout error:", err);
    return NextResponse.json({ error: (err as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
