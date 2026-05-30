"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Minus, Plus, Loader2, ArrowLeft, Mail, User as UserIcon } from "lucide-react";
import TransactpayButton from "../checkout/TransactpayButton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TicketSelectionModalProps {
  event: {
    id: string;
    title: string;
    slug: string;
    absorb_fees?: boolean;
    show_ticket_volume?: boolean;
  };
  ticketType: {
    name: string;
    price: number;
    early_bird_price?: number | null;
    capacity?: number;
    sold_count?: number;
    early_bird_until?: string;
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
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_type: string; discount_value: number; discount_amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();
          if (data) {
            setUserProfile(data);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      };
      fetchProfile();
    }
  }, [user]);

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

  // Recalculate discount if quantity updates
  useEffect(() => {
    if (appliedCoupon) {
      const subtotal = ticketType.price * quantity;
      let newDiscount = 0;
      if (appliedCoupon.discount_type === "percentage") {
        newDiscount = subtotal * (appliedCoupon.discount_value / 100);
      } else if (appliedCoupon.discount_type === "fixed") {
        newDiscount = appliedCoupon.discount_value;
      }
      newDiscount = Math.min(newDiscount, subtotal);
      newDiscount = Number(newDiscount.toFixed(2));
      setAppliedCoupon(prev => prev ? { ...prev, discount_amount: newDiscount } : null);
    }
  }, [quantity, ticketType.price, appliedCoupon?.discount_type, appliedCoupon?.discount_value]);

  const now = new Date();
  const isEarlyBirdActive = ticketType.early_bird_until && new Date(ticketType.early_bird_until) > now && ticketType.early_bird_price != null;
  const effectivePrice = isEarlyBirdActive ? ticketType.early_bird_price! : ticketType.price;
  const originalSubtotal = effectivePrice * quantity;
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const baseAmount = Math.max(0, originalSubtotal - discountAmount);

  const isAbsorbed = event.absorb_fees === true;
  const serviceFee = isAbsorbed ? 0 : baseAmount * (platformFeePercent / 100);
  const totalAmount = baseAmount + serviceFee;

  const remainingCapacity = ticketType.capacity !== undefined && ticketType.capacity !== null && Number(ticketType.capacity) > 0
    ? Math.max(0, Number(ticketType.capacity) - (ticketType.sold_count || 0))
    : 999;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          event_id: event.id,
          subtotal: originalSubtotal
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon({
          code: data.coupon.code,
          discount_type: data.coupon.discount_type,
          discount_value: data.coupon.discount_value,
          discount_amount: data.discount
        });
      } else {
        setCouponError(data.error || "Failed to apply coupon");
      }
    } catch (err) {
      setCouponError("Network error. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

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
              {event.show_ticket_volume && ticketType.capacity !== undefined && ticketType.capacity !== null && Number(ticketType.capacity) > 0 && (
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                  ({remainingCapacity} tickets remaining)
                </p>
              )}
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
                onClick={() => setQuantity(Math.min(remainingCapacity, quantity + 1))}
                disabled={quantity >= remainingCapacity}
                className="w-8 h-8 rounded-lg bg-zinc-200/60 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="space-y-3">
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal (original)</span>
                <span className="text-zinc-500 font-semibold line-through">₦{originalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-₦{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
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

          {/* Coupon Code Section */}
          <div className="pt-4 border-t border-zinc-200/60 space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Have a Coupon?</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <span className="font-bold bg-emerald-650 text-white text-xs px-2 py-0.5 rounded-md">{appliedCoupon.code}</span>
                  <span>Applied!</span>
                </div>
                <button 
                  onClick={handleRemoveCoupon} 
                  className="text-emerald-750 hover:text-emerald-950 font-bold text-xs underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="PROMO100" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-zinc-800 placeholder:text-zinc-400 text-sm font-bold uppercase"
                />
                <button 
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {applyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
            )}
            {couponError && (
              <p className="text-red-500 text-xs font-bold">{couponError}</p>
            )}
          </div>

          {/* User Auth or Guest Flow */}
          {activeUser ? (
            <div className="space-y-4">
              {guestUser && (
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-600 font-semibold">
                  Checking out as guest: <span className="font-bold">{guestEmail}</span>
                </div>
              )}
              <TransactpayButton 
                email={activeUser.email}
                amount={totalAmount}
                firstName={userProfile?.full_name?.split(" ")[0] || undefined}
                lastName={userProfile?.full_name?.split(" ").slice(1).join(" ") || undefined}
                phone={userProfile?.phone || undefined}
                couponCode={appliedCoupon?.code || undefined}
                metadata={{
                  event_id: event.id,
                  ticket_type_name: ticketType.name,
                  quantity: quantity,
                  user_id: activeUser.id,
                  guest_name: !user ? guestName : undefined
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
