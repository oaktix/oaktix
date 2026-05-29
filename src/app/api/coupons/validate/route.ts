import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, event_id, subtotal } = await req.json();

    if (!code || !event_id || subtotal === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch coupon details
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (couponError || !coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    // 2. Check validity dates
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ error: "Coupon is not yet active" }, { status: 400 });
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }

    // 3. Check usage limit
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: "Coupon usage limit has been reached" }, { status: 400 });
    }

    // 4. Check scope (Event specific, Vendor wide, or Global Admin)
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 400 });
    }

    let isApplicable = false;

    if (coupon.event_id) {
      // Event-specific coupon
      if (coupon.event_id === event_id) {
        isApplicable = true;
      }
    } else {
      // Global or Vendor-wide coupon. Check the role of the coupon creator.
      const { data: creator, error: creatorError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", coupon.creator_id)
        .single();

      if (!creatorError && creator) {
        if (creator.role === "admin" || creator.role === "super_admin") {
          // Admin coupon applies globally
          isApplicable = true;
        } else if (creator.role === "vendor" && coupon.creator_id === event.organizer_id) {
          // Vendor coupon applies to any of their own events
          isApplicable = true;
        }
      }
    }

    if (!isApplicable) {
      return NextResponse.json({ error: "Coupon is not applicable to this event" }, { status: 400 });
    }

    // 5. Calculate discount amount
    let discount = 0;
    const subtotalNum = Number(subtotal);

    if (coupon.discount_type === "percentage") {
      discount = subtotalNum * (Number(coupon.discount_value) / 100);
    } else if (coupon.discount_type === "fixed") {
      discount = Number(coupon.discount_value);
    }

    // Cap discount at subtotal amount
    discount = Math.min(discount, subtotalNum);
    discount = Number(discount.toFixed(2));

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value)
      },
      discount
    });
  } catch (err: unknown) {
    console.error("Coupon validation error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
