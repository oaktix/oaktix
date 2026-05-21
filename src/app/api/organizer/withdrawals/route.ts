import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const amount = Number(body.amount);
    
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
    }

    // 3. Fetch profile and verify bank details are present
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const payoutAccount = profile.vendor_details?.payout_account_number;
    if (!payoutAccount) {
      return NextResponse.json({ error: "Please link your payout bank method first." }, { status: 400 });
    }

    // 4. Fetch events and calculate available balance
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", user.id);

    const eventIds = events?.map(e => e.id) || [];

    // Fetch successful transactions for organizer's events
    let transactions: { vendor_net: number }[] = [];
    if (eventIds.length > 0) {
      const { data: txs } = await supabase
        .from("transactions")
        .select("vendor_net")
        .in("event_id", eventIds)
        .eq("status", "success");
      transactions = txs || [];
    }

    const totalSales = transactions.reduce((sum, tx) => sum + (Number(tx.vendor_net) || 0), 0);

    // Fetch existing withdrawals
    const { data: withdrawals } = await supabase
      .from("withdrawals")
      .select("amount, status")
      .eq("vendor_id", user.id);

    const totalWithdrawnAndPending = (withdrawals || [])
      .filter(w => w.status === "approved" || w.status === "pending")
      .reduce((sum, w) => sum + Number(w.amount) + 50, 0);

    const availableBalance = totalSales - totalWithdrawnAndPending;

    // 5. Verify available balance is sufficient
    if (availableBalance < amount + 50) {
      return NextResponse.json({ 
        error: `Insufficient balance. You need at least ₦${(amount + 50).toLocaleString()} (including ₦50 charge) but only have ₦${availableBalance.toLocaleString()} available.` 
      }, { status: 400 });
    }

    // 6. Insert new withdrawal request using admin client to guarantee execution
    const admin = createAdminSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: withdrawal, error: insertError } = await admin
      .from("withdrawals")
      .insert({
        vendor_id: user.id,
        amount: amount,
        status: "pending"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert withdrawal request:", insertError);
      return NextResponse.json({ error: "Failed to request withdrawal" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawal
    });

  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
