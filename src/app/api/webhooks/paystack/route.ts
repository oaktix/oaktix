import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";

export async function POST(req: Request) {
  const body = await req.json();
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(body))
    .digest("hex");

  if (hash !== req.headers.get("x-paystack-signature")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { event, data } = body;

  if (event === "charge.success") {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { 
      reference, 
      amount, 
      metadata: { event_id, ticket_type_name, quantity, user_id } 
    } = data;

    // 1. Create Transaction record
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        reference,
        buyer_id: user_id,
        event_id,
        amount: amount / 100,
        status: "success",
        payment_channel: data.channel,
        paid_at: data.paid_at
      });

    if (txError) {
      console.error("Transaction Error:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // 2. Generate Tickets
    for (let i = 0; i < quantity; i++) {
      const uniqueCode = `OAK-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      
      // Generate QR Code
      const qrData = JSON.stringify({ code: uniqueCode, event_id });
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 400 });

      // Upload QR Code to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("qr-codes")
        .upload(`${uniqueCode}.png`, qrBuffer, {
          contentType: "image/png",
        });

      if (storageError) {
        console.error("Storage Error:", storageError);
        continue;
      }

      const qrCodeUrl = supabase.storage.from("qr-codes").getPublicUrl(`${uniqueCode}.png`).data.publicUrl;

      // Create Ticket record
      await supabase.from("tickets").insert({
        unique_code: uniqueCode,
        qr_code_url: qrCodeUrl,
        event_id,
        buyer_id: user_id,
        ticket_type: { name: ticket_type_name, price: (amount / 100) / quantity },
        price_paid: (amount / 100) / quantity,
        status: "active"
      });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ received: true });
}
