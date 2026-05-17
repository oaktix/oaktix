"use client";

import { usePaystackPayment } from "react-paystack";

interface PaystackCustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

interface PaystackButtonProps {
  email: string;
  amount: number;
  metadata: {
    custom_fields?: PaystackCustomField[];
    [key: string]: unknown;
  };
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export default function PaystackButton({ email, amount, metadata, onSuccess, onClose }: PaystackButtonProps) {
  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: amount * 100, // Paystack works in kobo/cents
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      ...metadata,
      custom_fields: metadata.custom_fields || [],
    },
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      onClick={() => {
        initializePayment({ 
          onSuccess: (res: { reference: string }) => onSuccess(res.reference), 
          onClose 
        });
      }}
      className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg"
    >
      Pay ₦{amount.toLocaleString()}
    </button>
  );
}
