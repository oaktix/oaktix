"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Minus, Plus, Loader2, ArrowLeft, Mail, User as UserIcon } from "lucide-react";
import PaystackButton from "../checkout/PaystackButton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TicketSelectionModalProps {
  event: {
    id: string;
    title: string;
    slug: string;
    absorb_fees?: boolean;
  };
  ticketType: {
    name: string;
    price: number;
  };
  user: {
    id: string;
    email: string;
  } | null;
  onClose: () => void;
}

export default function TicketSelectionModal({ event, ticketType, user, onClose }: TicketSelectionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestUser, setGuestUser] = useState<{ id: string; email: string } | null>(null);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState(4.0);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("system_configurations")
          .select("value")
          .eq("key", "platform_markup")
          .maybeSingle();
        if (data?.value) {
          const val = data.value as { zero_fee_mode?: boolean; percentage?: number };
          if (val.zero_fee_mode) {
            setPlatformFeePercent(0);
          } else if (typeof val.percentage === 'number') {
            setPlatformFeePercent(val.percentage);
          }
        }
      } catch (err) {
        console.error("Error loading platform markup:", err);
      }
    };
    fetchConfig();
  }, []);

  const baseAmount = ticketType.price * quantity;
  const isAbsorbed = event.absorb_fees === true;
  const serviceFee = isAbsorbed ? 0 : baseAmount * (platformFeePercent / 100);
  const totalAmount = baseAmount + serviceFee;

  const handleSuccess = async (reference: string) => {
    if (!user) {
      // Guest checkout: redirect back to event description page with success parameters
      window.location.href = `/events/${event.slug}?checkout=success&reference=${reference}`;
    } else {
      // Authenticated checkout: redirect to dashboard tickets page
      window.location.href = `/dashboard/tickets?reference=${reference}`;
    }
  };

  const handleGuestCheckoutSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail || !guestName) return;

    setLoadingGuest(true);
    setGuestError(null);

    try {
      // 1. Try server-side admin guest registration first
      const res = await fetch("/api/checkout/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail, fullName: guestName }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setGuestUser({ id: data.user.id, email: data.user.email });
      } else {
        // Fallback: If guest registration API fails or has a network issue,
        // let the guest proceed to payment using their email statelessly.
        // The backend webhook will securely handle/create their account upon successful verification.
        setGuestUser({ id: "guest_pending", email: guestEmail });
      }
    } catch (err: unknown) {
      console.error(err);
      setGuestError((err as Error).message || "Failed to proceed as guest. Please try again.");
    } finally {
      setLoadingGuest(false);
    }
  }, [guestEmail, guestName]);

  const activeUser = user || guestUser;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="glass-card w-full max-w-md p-5 sm:p-8 max-h-[90vh] overflow-y-auto relative z-10 bg-white/95 border-zinc-200/80 shadow-2xl text-zinc-800">
        <button aria-label="Close modal" onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mb-1">{event.title}</p>
          <h2 className="text-2xl font-bold font-heading text-zinc-900">Checkout</h2>
        </div>

        <div className="space-y-6">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <div>
              <p className="font-bold text-zinc-900">{ticketType.name}</p>
              <p className="text-zinc-500 text-xs mt-0.5">₦{Number(ticketType.price).toLocaleString()} per ticket</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                aria-label="Decrease quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-zinc-200/60 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-4 text-center text-zinc-800">{quantity}</span>
              <button 
                aria-label="Increase quantity"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-zinc-200/60 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Subtotal</span>
              <span className="text-zinc-800 font-semibold">₦{baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Service Fee</span>
              {isAbsorbed ? (
                <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center">
                  Absorbed by Organizer
                </span>
              ) : (
                <span className="text-zinc-800 font-semibold">₦{serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              )}
            </div>
            <div className="flex justify-between text-xl font-bold font-heading pt-3 border-t border-zinc-200/60">
              <span className="text-zinc-900">Total</span>
              <span className="text-indigo-600">₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* User Auth or Guest Flow */}
          {activeUser ? (
            <div className="space-y-4">
              {guestUser && (
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-600 font-semibold">
                  Checking out as guest: <span className="font-bold">{guestEmail}</span>
                </div>
              )}
              <PaystackButton 
                email={activeUser.email}
                amount={totalAmount}
                metadata={{
                  event_id: event.id,
                  ticket_type_name: ticketType.name,
                  quantity: quantity,
                  user_id: activeUser.id
                }}
                onSuccess={handleSuccess}
                onClose={() => console.log('Payment closed')}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {!isGuestMode ? (
                <div className="space-y-3">
                  <p className="text-zinc-500 text-xs text-center mb-1">Log in to track orders or proceed directly as a guest.</p>
                  <Link 
                    href={`/login?redirect=/events/${event.slug}`}
                    className="w-full block text-center py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    Log In / Create Account
                  </Link>
                  <button 
                    onClick={() => setIsGuestMode(true)}
                    className="w-full text-center py-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold transition-all border border-zinc-200 cursor-pointer"
                  >
                    Continue as Guest
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGuestCheckoutSubmit} className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <button 
                      type="button"
                      onClick={() => setIsGuestMode(false)}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to options
                    </button>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Guest Checkout</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          placeholder="Your full name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-800 placeholder:text-zinc-400 transition-colors text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-800 placeholder:text-zinc-400 transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {guestError && (
                    <p className="text-red-500 text-xs font-bold text-center mt-1">{guestError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loadingGuest}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {loadingGuest ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                      </>
                    ) : (
                      "Continue to Payment"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
