"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface TransactpayButtonProps {
  email: string;
  amount: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  metadata: {
    event_id: string;
    ticket_type_name: string;
    quantity: number;
    user_id: string;
    guest_name?: string;
  };
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    CheckoutNS?: {
      PaymentCheckout: new (options: {
        firstName: string;
        lastName: string;
        mobile: string;
        country: string;
        email: string;
        currency: string;
        amount: number;
        reference: string;
        merchantReference: string;
        description: string;
        apiKey: string;
        encryptionKey: string;
        onCompleted: (data: { status?: string; reference?: string; [key: string]: unknown }) => void;
        onClose: () => void;
        onError: (error: unknown) => void;
      }) => { init: () => void };
    };
  }
}

const loadTransactpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.CheckoutNS) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://payment-web-sdk.transactpay.ai/v1/checkout";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function TransactpayButton({
  email,
  amount,
  firstName,
  lastName,
  phone,
  metadata,
  onSuccess,
  onClose,
}: TransactpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Load the script first
      const scriptLoaded = await loadTransactpayScript();
      if (!scriptLoaded || !window.CheckoutNS) {
        throw new Error("Failed to load Transactpay checkout script.");
      }

      // 2. Initialize checkout session on server to get the reference
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount,
          event_id: metadata.event_id,
          ticket_type_name: metadata.ticket_type_name,
          quantity: metadata.quantity,
          user_id: metadata.user_id,
          guest_name: metadata.guest_name,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initialize transaction.");
      }

      const { reference } = await res.json();

      // 3. Prepare parameters
      const fullName = (firstName && lastName)
        ? `${firstName} ${lastName}`
        : (metadata.guest_name || "OakTix Buyer");
      const nameParts = fullName.trim().split(/\s+/);
      const derivedFirstName = nameParts[0] || "OakTix";
      const derivedLastName = nameParts.slice(1).join(" ") || "Buyer";
      const derivedPhone = phone || "09000000000";

      const apiKey = process.env.NEXT_PUBLIC_TRANSACTPAY_PUBLIC_KEY || "";
      const encryptionKey = process.env.NEXT_PUBLIC_TRANSACTPAY_ENCRYPTION_KEY || "";

      // 4. Initialize Payment Checkout
      const checkout = new window.CheckoutNS.PaymentCheckout({
        firstName: derivedFirstName,
        lastName: derivedLastName,
        mobile: derivedPhone,
        country: "NG",
        email: email,
        currency: "NGN",
        amount: amount * 100, // Transactpay works in kobo/cents
        reference: reference,
        merchantReference: reference,
        description: `${metadata.quantity}x ${metadata.ticket_type_name} for OakTix Event`,
        apiKey,
        encryptionKey,
        onCompleted: (data) => {
          console.log("Transactpay complete callback data:", data);
          if (data?.status?.toLowerCase() === "successful") {
            onSuccess(reference);
          } else {
            setErrorMsg("Payment status: " + (data?.status || "Failed"));
          }
        },
        onClose: () => {
          onClose();
        },
        onError: (err) => {
          console.error("Transactpay error callback:", err);
          setErrorMsg("Payment error occurred. Please try again.");
        },
      });

      checkout.init();
    } catch (err: unknown) {
      console.error("Transactpay error:", err);
      setErrorMsg((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:bg-indigo-400"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Initializing Payment...
          </>
        ) : (
          `Pay ₦${amount.toLocaleString()}`
        )}
      </button>
      {errorMsg && (
        <p className="text-rose-500 text-xs font-bold text-center">{errorMsg}</p>
      )}
    </div>
  );
}
