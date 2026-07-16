import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { Resend } from "resend";
import {
  sendRegistrationPendingEmail,
  sendRegistrationWaitlistEmail,
  sendOrganizerPendingRequestEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  let body: {
    email?: string;
    event_id?: string;
    ticket_type_name?: string;
    quantity?: number;
    user_id?: string;
    guest_name?: string;
    phone?: string;
    coupon_code?: string;
  };

  try {
    body = await req.json();
  } catch (err) {
    console.error("Failed to parse free checkout JSON:", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, event_id, ticket_type_name, quantity, user_id, guest_name, phone } = body;

  // 1. Validate required fields
  if (!email || !event_id || !ticket_type_name || !quantity) {
    return NextResponse.json(
      { error: "Missing required fields: email, event_id, ticket_type_name, quantity" },
      { status: 400 }
    );
  }

  // Phone is mandatory for guest checkouts
  const isGuest = !user_id || user_id === "guest_pending";
  if (isGuest && !phone) {
    return NextResponse.json(
      { error: "Phone number is required for guest checkout" },
      { status: 400 }
    );
  }

  // 2. Create service role Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Fetch event
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", event_id)
    .single();

  if (eventError || !eventData) {
    console.error("Event not found for free checkout:", event_id, eventError);
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // 4. Find the ticket tier
  const tier = (eventData.ticket_types as Array<{ name: string; price: number | string; capacity?: number }>)?.find(
    (t) => t.name === ticket_type_name
  );

  if (!tier) {
    return NextResponse.json({ error: "Ticket type not found" }, { status: 400 });
  }

  // 5. SECURITY CHECK: ensure the ticket is actually free
  if (Number(tier.price) !== 0) {
    return NextResponse.json({ error: "This ticket type is not free" }, { status: 400 });
  }

  // 5b. Read approval/waitlist config + event format
  const requiresApproval: boolean = eventData.requires_approval === true;
  const enableWaitlist: boolean = eventData.enable_waitlist === true;
  const virtualDetails = (eventData.virtual_details as { platform?: string; link?: string; password?: string } | null) || null;
  const isVirtual =
    eventData.type === "virtual" || eventData.venue_details?.name === "Virtual";

  // 6. Check capacity using ONLY approved registrations.
  // Effective capacity is the tier capacity if set, otherwise the event max_attendees.
  const effectiveCapacity: number | null =
    typeof tier.capacity === "number"
      ? tier.capacity
      : typeof eventData.max_attendees === "number"
        ? eventData.max_attendees
        : null;

  // Per-tier approved count (used for the tier-specific capacity gate).
  const tierApprovedQuery = supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event_id)
    .in("status", ["active", "used"])
    .eq("registration_status", "approved")
    .eq("ticket_type->>name", ticket_type_name);

  // Event-wide approved count (used when capacity comes from max_attendees).
  const eventApprovedQuery = supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event_id)
    .in("status", ["active", "used"])
    .eq("registration_status", "approved");

  const { count: tierApprovedCount } = await tierApprovedQuery;
  const { count: eventApprovedCount } = await eventApprovedQuery;

  // When capacity is the tier capacity, compare against the tier approved count;
  // otherwise (max_attendees) compare against the event-wide approved count.
  const approvedCount =
    typeof tier.capacity === "number" ? tierApprovedCount ?? 0 : eventApprovedCount ?? 0;

  const capacityFull = effectiveCapacity !== null && approvedCount >= effectiveCapacity;

  // Decide the registration status for the new tickets.
  // 'approved' (default) → full ticket/meeting email
  // 'pending'            → awaiting organizer approval (no meeting link)
  // 'waitlist'           → capacity full + waitlist enabled (no meeting link)
  let registrationStatus: "approved" | "pending" | "waitlist" = "approved";

  if (capacityFull) {
    if (enableWaitlist) {
      registrationStatus = "waitlist";
    } else {
      // No waitlist → preserve existing sold-out behaviour (before creating tickets).
      return NextResponse.json({ error: "Sold out" }, { status: 400 });
    }
  } else if (requiresApproval) {
    registrationStatus = "pending";
  }

  // 7. Resolve buyer user — mirrors webhook guest user resolution exactly
  let buyerId = user_id;
  let generatedPassword: string | null = null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isGuest = !buyerId || buyerId === "guest_pending" || !uuidRegex.test(buyerId);

  if (isGuest && email) {
    const customerEmail = email.toLowerCase();
    let matchedUser = null;

    try {
      // Try to list users to see if they already exist
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      if (existingUsers) {
        matchedUser = existingUsers.users.find((u: any) => u.email?.toLowerCase() === customerEmail);
      }

      if (!matchedUser) {
        // Generate a secure temporary password
        const tempPassword =
          "OakTix_" +
          Math.random().toString(36).substring(2, 10) +
          Math.random().toString(36).substring(2, 6).toUpperCase() +
          "!";
        generatedPassword = tempPassword;

        // Create standard confirmed user account if they don't exist
        const customerName = guest_name || "Guest Buyer";
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: customerEmail,
          password: tempPassword,
          email_confirm: false,
            user_metadata: {
              full_name: customerName,
              role: "user",
              phone: phone || null,
            },
        });

        // Send the OTP verification email so the guest can confirm their
        // account when they first log in.
        if (!createError && newUser?.user) {
          await supabase.auth.resend({ type: "signup", email: customerEmail }).catch(() => {
            // Non-fatal — guest can request a new code from the login page
          });
        }

        if (!createError && newUser?.user) {
          matchedUser = newUser.user;
          // Create profile record
          await supabase.from("profiles").insert({
            id: matchedUser.id,
            full_name: customerName,
            email: customerEmail,
            role: "user",
            phone: phone || null,
          });
        }
      }
    } catch (err) {
      console.warn("Free checkout admin user creation failed, falling back to public signup:", err);
    }

    // Fallback: signup statelessly using public auth.signUp
    if (!matchedUser) {
      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();

        if (existingProfile) {
          buyerId = existingProfile.id;
        } else {
          const customerName = guest_name || "Guest Buyer";
          const tempPassword =
            "OakTix_" +
            Math.random().toString(36).substring(2, 10) +
            Math.random().toString(36).substring(2, 6).toUpperCase() +
            "!";
          generatedPassword = tempPassword;

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: customerEmail,
            password: tempPassword,
            options: {
              data: {
                full_name: customerName,
                role: "user",
                phone: phone || null,
              },
            },
          });

          if (!signUpError && signUpData?.user) {
            buyerId = signUpData.user.id;
            await supabase.from("profiles").insert({
              id: buyerId,
              full_name: customerName,
              email: customerEmail,
              role: "user",
              phone: phone || null,
            });
          } else {
            console.warn("Public signup fallback inside free checkout failed:", signUpError);
            const { data: secondaryProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customerEmail)
              .maybeSingle();
            if (secondaryProfile) {
              buyerId = secondaryProfile.id;
            } else {
              buyerId = undefined;
            }
          }
        }
      } catch (fallbackErr) {
        console.error("Critical fallback failure in free checkout:", fallbackErr);
        buyerId = undefined;
      }
    } else {
      buyerId = matchedUser.id;
    }
  }

  // Ensure profile exists in profiles table for buyerId to avoid foreign key violation
  if (buyerId && uuidRegex.test(buyerId)) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", buyerId)
      .maybeSingle();

    if (!existingProfile) {
      let profileEmail = email?.toLowerCase() || "";
      let profileName = guest_name || "Valued Guest";

      if (!profileEmail || profileName === "Valued Guest") {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(buyerId);
          if (authUser?.user) {
            profileEmail = authUser.user.email || profileEmail;
            profileName = authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || profileName;
          }
        } catch (e) {
          console.warn("Failed to fetch auth user details for profile creation:", e);
        }
      }

      const { error: profileInsertError } = await supabase.from("profiles").insert({
        id: buyerId,
        full_name: profileName,
        email: profileEmail,
        role: "user",
        ...(phone ? { phone } : {}),
      });

      if (profileInsertError) {
        console.error("Failed to auto-create missing profile for buyer:", buyerId, profileInsertError);
      } else {
        console.log("Successfully auto-created missing profile for buyer:", buyerId);
      }
    }
  }

  // 8. Generate reference
  const reference = `FREE-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // 9. Fetch sold count (for record-keeping — capacity already checked above)
  const { count: currentSoldCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event_id)
    .in("status", ["active", "used"])
    .eq("ticket_type->>name", ticket_type_name);

  console.log(`Free checkout: ${currentSoldCount ?? 0} tickets already sold for ${ticket_type_name}`);

  // 10. Insert transaction row
  const { error: txInsertError } = await supabase.from("transactions").insert({
    reference,
    buyer_id: buyerId,
    event_id,
    amount: 0,
    platform_fee: 0,
    vendor_net: 0,
    status: "success",
    payment_channel: "Free",
    paid_at: new Date().toISOString(),
    coupon_code: null,
    discount_amount: 0,
  });

  if (txInsertError) {
    console.error("Free checkout transaction insert error:", txInsertError);
    return NextResponse.json({ error: txInsertError.message }, { status: 500 });
  }

  // Gather event display details for emails
  let eventTitle = eventData.title || "Your OakTix Event";
  let eventDateText = "Date is listed on your dashboard";
  let eventLocationText = "Venue is listed on your dashboard";
  let eventBannerUrl = "";

  if (eventData.start_date) {
    eventDateText = new Date(eventData.start_date).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  eventLocationText = eventData.venue_details?.name || eventData.location || eventLocationText;
  eventBannerUrl = eventData.featured_image || eventData.image_url || "";

  const generatedTickets: Array<{ uniqueCode: string; qrCodeUrl: string }> = [];

  // 11. Generate tickets
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
      console.error("Storage Error in free checkout:", storageError);
      continue;
    }

    const qrCodeUrl = supabase.storage.from("qr-codes").getPublicUrl(`${uniqueCode}.png`).data.publicUrl;

    // Insert ticket record
    await supabase.from("tickets").insert({
      unique_code: uniqueCode,
      qr_code_url: qrCodeUrl,
      event_id,
      buyer_id: buyerId,
      ticket_type: { name: ticket_type_name, price: 0 },
      price_paid: 0,
      status: "active",
      registration_status: registrationStatus,
    });

    generatedTickets.push({ uniqueCode, qrCodeUrl });
  }

  // 12. Send buyer confirmation email
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const buyerEmail = email || "hello@oaktix.com.ng";

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

              <!-- Account Created Notice (Only for new guest signups) -->
              ${generatedPassword ? `
              <div style="background:#F0FDF4; border:1px solid #DCFCE7; border-radius:16px; padding:20px; margin-bottom:32px;">
                <h4 style="margin:0 0 6px 0; font-size:14px; font-weight:700; color:#15803D;">Your OakTix Account Is Ready! 🔑</h4>
                <p style="margin:0 0 12px 0; font-size:13px; color:#166534; line-height:1.5;">
                  We have automatically set up a customer account for you to track this ticket and any future event bookings.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; border:1px solid #E8EBE7; padding:12px; margin-top:8px;">
                  <tr>
                    <td style="font-size:12px; color:#64786B; padding:4px 0;"><strong>Sign In URL:</strong> <a href="https://oaktix.com.ng/login" style="color:#0E4B31; font-weight:bold; text-decoration:underline;">oaktix.com.ng/login</a></td>
                  </tr>
                  <tr>
                    <td style="font-size:12px; color:#64786B; padding:4px 0;"><strong>Username:</strong> ${buyerEmail}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px; color:#64786B; padding:4px 0;"><strong>Password:</strong> <span style="font-family:monospace; background:#FAF9F6; border:1px solid #E8EBE7; padding:2px 8px; border-radius:6px; font-weight:bold; color:#0E4B31; font-size:13px;">${generatedPassword}</span></td>
                  </tr>
                </table>
                <p style="margin:12px 0 0 0; font-size:11px; color:#889C8F; font-style:italic;">
                  We recommend logging in and changing your password in your settings profile as soon as possible.
                </p>
              </div>
              ` : ""}

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

              <!-- Meeting Link (virtual events only) -->
              ${isVirtual && virtualDetails?.link ? `
              <div style="background:#F0FDF4; border:1px solid #DCFCE7; border-radius:16px; padding:20px; margin-bottom:32px;">
                <h4 style="margin:0 0 10px 0; font-size:14px; font-weight:700; color:#15803D;">🔗 Join the event online</h4>
                <p style="margin:0 0 6px 0; font-size:13px; color:#166534; line-height:1.5;">
                  <strong>Meeting Link:</strong> <a href="${virtualDetails.link}" style="color:#0E4B31; font-weight:bold; text-decoration:underline; word-break:break-all;">${virtualDetails.link}</a>
                </p>
                ${virtualDetails.password ? `<p style="margin:0; font-size:13px; color:#166534;"><strong>Passcode:</strong> <span style="font-family:monospace; background:#ffffff; border:1px solid #DCFCE7; padding:2px 8px; border-radius:6px; font-weight:bold;">${virtualDetails.password}</span></p>` : ""}
              </div>
              ` : ""}

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

  // Buyer email depends on the registration decision:
  //  - approved  → full ticket email (with meeting link for virtual)
  //  - pending   → "request received, pending approval" (no meeting link)
  //  - waitlist  → "you're on the waitlist" (no meeting link)
  if (registrationStatus === "pending") {
    await sendRegistrationPendingEmail({
      to: buyerEmail,
      eventTitle,
      eventDate: eventDateText,
      eventLocation: eventLocationText,
      isVirtual,
      eventBannerUrl,
    });
  } else if (registrationStatus === "waitlist") {
    await sendRegistrationWaitlistEmail({
      to: buyerEmail,
      eventTitle,
      eventDate: eventDateText,
      eventLocation: eventLocationText,
      isVirtual,
      eventBannerUrl,
    });
  } else {
    try {
      const emailSendResult = await resend.emails.send({
        from: "OakTix <hello@oaktix.com.ng>",
        to: buyerEmail,
        subject: `Your OakTix Tickets: ${eventTitle}`,
        html: emailHtml,
      });

      if (emailSendResult.error) {
        console.warn("Primary domain dispatch failed, retrying with sandbox onboarding@resend.dev...", emailSendResult.error);
        await resend.emails.send({
          from: "OakTix <onboarding@resend.dev>",
          to: buyerEmail,
          subject: `[Sandbox] Your OakTix Tickets: ${eventTitle}`,
          html: emailHtml,
        });
      }
    } catch (err) {
      console.error("Resend delivery crashed, retrying with sandbox email from address:", err);
      try {
        await resend.emails.send({
          from: "OakTix <onboarding@resend.dev>",
          to: buyerEmail,
          subject: `[Sandbox] Your OakTix Tickets: ${eventTitle}`,
          html: emailHtml,
        });
      } catch (fallbackErr) {
        console.error("Sandbox fallback dispatch failed:", fallbackErr);
      }
    }
  }

  // 13. Send organizer notification email
  try {
    const organizerId = eventData?.organizer_id;
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

      if (organizerEmail && registrationStatus === "pending") {
        // Pending request → ask the organizer to review/approve.
        await sendOrganizerPendingRequestEmail({
          to: organizerEmail,
          organizerName: profile?.full_name || undefined,
          eventTitle,
          buyerName: guest_name || "Valued Guest",
          buyerEmail,
          ticketTypeName: ticket_type_name,
          quantity: quantity!,
        });
      } else if (organizerEmail && registrationStatus === "approved") {
        const buyerName = guest_name || "Valued Guest";
        const organizerEmailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Ticket Claimed!</title>
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
                  New Ticket Claimed!
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
                A new free ticket booking has been successfully confirmed for your event <strong>${eventTitle}</strong>. Here are the details of the registration:
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
                    <td style="padding:6px 0; font-size:13px; color:#64786B;"><strong>Total Paid:</strong> Free</td>
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
          subject: `[OakTix] New Free Ticket Claimed: ${eventTitle}`,
          html: organizerEmailHtml,
        });
      }
    }
  } catch (err) {
    console.error("Organizer notification failed in free checkout:", err);
  }

  // 14. Return success
  return NextResponse.json({ success: true, reference });
}
