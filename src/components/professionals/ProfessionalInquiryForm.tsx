"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, CalendarDays, MessageSquare, DollarSign } from "lucide-react";
import { submitInquiry } from "@/lib/professionals/actions";
import { EVENT_TYPES } from "@/lib/professionals/types";

interface ProfessionalInquiryFormProps {
  professionalId: string;
  professionalName: string;
}

export default function ProfessionalInquiryForm({
  professionalId,
  professionalName,
}: ProfessionalInquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    event_type: "",
    event_date: "",
    event_location: "",
    guest_count: "",
    budget: "",
    message: "",
  });

  const update = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await submitInquiry(professionalId, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      whatsapp: formData.whatsapp || undefined,
      event_type: formData.event_type || undefined,
      event_date: formData.event_date || undefined,
      event_location: formData.event_location || undefined,
      guest_count: formData.guest_count ? Number(formData.guest_count) : undefined,
      budget: formData.budget ? Number(formData.budget) : undefined,
      message: formData.message,
    });

    setLoading(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Inquiry Sent!</h3>
        <p className="text-sm text-zinc-500">
          Your message has been sent to <strong>{professionalName}</strong>. They will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Your Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Your Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Full name"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+234..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">WhatsApp</label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            placeholder="+234..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Event Details */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-[#E8EBE7] dark:border-white/5 space-y-3">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" /> Event Details (optional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Event Type</label>
            <select
              value={formData.event_type}
              onChange={(e) => update("event_type", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">Select type</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Event Date</label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) => update("event_date", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Event Location</label>
            <input
              type="text"
              value={formData.event_location}
              onChange={(e) => update("event_location", e.target.value)}
              placeholder="City, venue, or address"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Budget (₦)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="Your budget"
              min={0}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> Message *
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder={`Tell ${professionalName} what you need and any specific requirements...`}
          required
          rows={4}
          className="w-full px-3.5 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none leading-relaxed"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-md shadow-indigo-500/10"
      >
        {loading ? (
          <span className="animate-pulse">Sending...</span>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send Inquiry
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-zinc-400">
        By sending an inquiry you agree to our terms. Your contact details will only be shared with this professional.
      </p>
    </form>
  );
}
