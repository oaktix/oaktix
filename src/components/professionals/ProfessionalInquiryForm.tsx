"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, CalendarDays, MessageSquare, DollarSign } from "lucide-react";
import { submitInquiry } from "@/lib/professionals/actions";
import { EVENT_TYPES } from "@/lib/professionals/types";

interface ProfessionalInquiryFormProps {
  professionalId: string;
  professionalName: string;
  /** Professional's WhatsApp number (e.g. "+2348012345678"). If present, opens WhatsApp after send. */
  professionalWhatsApp?: string | null;
}

export default function ProfessionalInquiryForm({
  professionalId,
  professionalName,
  professionalWhatsApp,
}: ProfessionalInquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
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
      // Build WhatsApp deep-link if the professional has a number
      if (professionalWhatsApp) {
        const cleanNumber = professionalWhatsApp.replace(/\D/g, "");
        const text = encodeURIComponent(
          `Hi ${professionalName}, I just sent you an inquiry via OakTix. Looking forward to hearing from you!`
        );
        setWhatsappUrl(`https://wa.me/${cleanNumber}?text=${text}`);
      }
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="space-y-3">
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Inquiry Sent!</h3>
          <p className="text-sm text-zinc-500">
            Your message has been sent to <strong>{professionalName}</strong>. They will get back to you soon.
          </p>
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm transition-all shadow-md shadow-green-500/20"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Also message on WhatsApp
          </a>
        )}
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
