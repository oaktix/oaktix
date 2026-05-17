import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";
import { Resend } from "resend";

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

    let buyerId = user_id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isGuest = !buyerId || buyerId === "guest_pending" || !uuidRegex.test(buyerId);

    if (isGuest && data.customer?.email) {
      const customerEmail = data.customer.email.toLowerCase();
      
      // 1. Try to list users to see if they already exist
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      let matchedUser = existingUsers?.users.find(u => u.email?.toLowerCase() === customerEmail);

      if (!matchedUser) {
        // 2. Create standard confirmed user account if they don't exist
        const customerName = data.customer.name || data.customer.first_name || "Guest Buyer";
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          user_metadata: {
            full_name: customerName,
            role: "user",
            otp_verified: true
          }
        });

        if (!createError && newUser?.user) {
          matchedUser = newUser.user;
          // Also create profile record
          await supabase.from("profiles").insert({
            id: matchedUser.id,
            full_name: customerName,
            email: customerEmail,
            role: "user"
          });
        }
      }

      if (matchedUser) {
        buyerId = matchedUser.id;
      }
    }

    // 1. Create Transaction record
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        reference,
        buyer_id: buyerId,
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

    const generatedTickets = [];

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
        buyer_id: buyerId,
        ticket_type: { name: ticket_type_name, price: (amount / 100) / quantity },
        price_paid: (amount / 100) / quantity,
        status: "active"
      });

      generatedTickets.push({ uniqueCode, qrCodeUrl });
    }

    // 3. Dispatch branded HTML email confirmation via Resend
    let eventTitle = "Your OakTix Event";
    let eventDateText = "Date is listed on your dashboard";
    let eventLocationText = "Venue is listed on your dashboard";
    let eventBannerUrl = "";
    let dbEvent: any = null;

    try {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", event_id)
        .single();
      
      dbEvent = data;
      if (dbEvent) {
        eventTitle = dbEvent.title || eventTitle;
        if (dbEvent.start_date) {
          eventDateText = new Date(dbEvent.start_date).toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        }
        eventLocationText = dbEvent.venue_details?.name || dbEvent.location || eventLocationText;
        eventBannerUrl = dbEvent.featured_image || dbEvent.image_url || "";
      }
    } catch (err) {
      console.error("Error fetching event details for email:", err);
    }

    const resend = new Resend(process.env.RESEND_API_KEY!);
    const buyerEmail = data.customer?.email || "hello@oaktix.com.ng";

    let ticketsHtml = "";
    for (const t of generatedTickets) {
      ticketsHtml += `
        <div style="background:#ffffff; border:1px solid #E8EBE7; border-radius:16px; padding:24px; margin-bottom:20px; box-shadow:0 4px 12px rgba(0,0,0,0.02); text-align:center;">
          <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; color:#889C8F; letter-spacing:1px; text-transform:uppercase;">${ticket_type_name}</p>
          <p style="margin:0 0 16px 0; font-size:16px; font-weight:700; color:#0E4B31; font-family:monospace;">${t.uniqueCode}</p>
          
          <div style="margin:16px auto; width:200px; height:200px; text-align:center;">
            <img src="${t.qrCodeUrl}" alt="Ticket QR Code" style="width:200px; height:200px; border-radius:8px;" />
          </div>
          
          <p style="margin:12px 0 0 0; font-size:12px; color:#64786B;">Scan this QR code at the entrance for verification.</p>
        </div>
      `;
    }

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your OakTix Tickets</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF9F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6; padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px; background:#ffffff; border-radius:24px; border:1px solid #E8EBE7; box-shadow:0 8px 32px rgba(0,0,0,0.04); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0E4B31 0%,#1a6b47 100%); padding:32px 40px; text-align:center;">
              <span style="font-size:28px;">🎟️</span>
              <div style="margin-top:8px;">
                <span style="font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                  <span style="color:#5fa589;">Oak</span>Tix
                </span>
              </div>
              <p style="color:rgba(255,255,255,0.7); font-size:12px; margin:4px 0 0; text-transform:uppercase; letter-spacing:1px;">Booking Confirmed</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px 40px;">
              <h2 style="font-size:22px; font-weight:700; color:#1A1A1A; margin:0 0 8px 0;">Your tickets are ready! 🎉</h2>
              <p style="font-size:14px; color:#64786B; line-height:1.6; margin:0 0 28px 0;">
                Thank you for choosing OakTix. Below are your dynamic tickets and QR codes for entry. Please keep this email safe and present the QR codes at the gate.
              </p>

              <!-- Event Details Card -->
              <div style="background:#FAF9F6; border:1px solid #E8EBE7; border-radius:16px; padding:20px; margin-bottom:32px;">
                ${eventBannerUrl ? `<img src="${eventBannerUrl}" alt="Event Banner" style="width:100%; height:160px; object-fit:cover; border-radius:8px; margin-bottom:16px;" />` : ""}
                <h3 style="margin:0 0 8px 0; font-size:18px; font-weight:700; color:#0E4B31;">${eventTitle}</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                  <tr>
                    <td style="padding:4px 0; font-size:13px; color:#64786B;"><strong>Date:</strong> ${eventDateText}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0; font-size:13px; color:#64786B;"><strong>Venue:</strong> ${eventLocationText}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0; font-size:13px; color:#64786B;"><strong>Reference:</strong> ${reference}</td>
                  </tr>
                </table>
              </div>

              <h4 style="font-size:14px; font-weight:700; color:#1A1A1A; margin:0 0 16px 0; text-transform:uppercase; letter-spacing:0.5px;">Your Tickets (${quantity})</h4>
              
              ${ticketsHtml}

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background:#E8EBE7;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; text-align:center;">
              <p style="font-size:12px; color:#BAC6BF; margin:0 0 4px 0;">
                OakTix Ticket Delivery · Nigeria's Favourite Event Marketplace
              </p>
              <p style="font-size:11px; color:#889C8F; margin:0;">
                Need help? Contact us at <a href="mailto:hello@oaktix.com.ng" style="color:#0E4B31; text-decoration:underline;">hello@oaktix.com.ng</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      const { error: emailSendError } = await resend.emails.send({
        from: "OakTix <hello@oaktix.com.ng>",
        to: buyerEmail,
        subject: `Your OakTix Tickets: ${eventTitle}`,
        html: emailHtml,
      });

      if (emailSendError) {
        console.error("Resend delivery failed:", emailSendError);
      }
    } catch (err) {
      console.error("Resend API call crashed:", err);
    }

    // 4. Dispatch notification to the event organizer/vendor
    try {
      const organizerId = dbEvent?.organizer_id;
      if (organizerId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", organizerId)
          .single();

        let organizerEmail = profile?.email;
        if (!organizerEmail) {
          const { data: authUser } = await supabase.auth.admin.getUserById(organizerId);
          organizerEmail = authUser?.user?.email;
        }

        if (organizerEmail) {
          const buyerName = data.customer?.name || data.customer?.first_name || "Valued Guest";
          const totalPaid = amount / 100;

          const organizerEmailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Ticket Sold!</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF9F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6; padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px; background:#ffffff; border-radius:24px; border:1px solid #E8EBE7; box-shadow:0 8px 32px rgba(0,0,0,0.04); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0E4B31 0%,#1a6b47 100%); padding:32px 40px; text-align:center;">
              <span style="font-size:28px;">💰</span>
              <div style="margin-top:8px;">
                <span style="font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                  New Ticket Sold!
                </span>
              </div>
              <p style="color:rgba(255,255,255,0.7); font-size:12px; margin:4px 0 0; text-transform:uppercase; letter-spacing:1px;">OakTix Notification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px 40px;">
              <h2 style="font-size:22px; font-weight:700; color:#1A1A1A; margin:0 0 8px 0;">Congratulations, ${profile?.full_name || "Organizer"}! 🎉</h2>
              <p style="font-size:14px; color:#64786B; line-height:1.6; margin:0 0 28px 0;">
                A new ticket booking has been successfully confirmed and paid for your event <strong>${eventTitle}</strong>. Here are the details of the transaction:
              </p>

              <!-- Transaction details card -->
              <div style="background:#FAF9F6; border:1px solid #E8EBE7; border-radius:16px; padding:20px; margin-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Buyer Name:</strong> ${buyerName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Buyer Email:</strong> ${buyerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Ticket Type:</strong> ${ticket_type_name}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Quantity:</strong> ${quantity}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Total Paid:</strong> ₦${totalPaid.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Reference:</strong> ${reference}</td>
                  </tr>
                </table>
              </div>

              <p style="font-size:13px; color:#889C8F; line-height:1.6; margin:24px 0 0; text-align:center;">
                You can view attendee details and financial reports directly on your <a href="https://oaktix.com.ng/organizer" style="color:#0E4B31; font-weight:bold; text-decoration:none;">Organizer Dashboard</a>.
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background:#E8EBE7;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; text-align:center;">
              <p style="font-size:12px; color:#BAC6BF; margin:0 0 4px 0;">
                OakTix Partner Hub · Nigeria's Favourite Event Marketplace
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await resend.emails.send({
            from: "OakTix <hello@oaktix.com.ng>",
            to: organizerEmail,
            subject: `[OakTix] New Booking Confirmed: ${eventTitle}`,
            html: organizerEmailHtml,
          });
        }
      }
    } catch (err) {
      console.error("Organizer notification failed:", err);
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ received: true });
}
