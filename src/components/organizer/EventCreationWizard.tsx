"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Plus, Trash2, MapPin, Calendar, Image as ImageIcon, Ticket } from "lucide-react";
import Image from "next/image";

interface TicketType {
  name: string;
  price: number;
  description: string;
  perks: string[];
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  venue_details?: {
    name?: string;
    address?: string;
  } | null;
  max_attendees?: number | null;
  ticket_types?: TicketType[] | null;
  featured_image?: string | null;
  absorb_fees?: boolean;
  status?: string;
}

interface EventCreationWizardProps {
  event?: EventData | null;
}

export default function EventCreationWizard({ event }: EventCreationWizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: event?.title || "",
    slug: event?.slug || "",
    description: event?.description || "",
    start_date: event?.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "",
    end_date: event?.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "",
    venue_name: event?.venue_details?.name && event.venue_details.name !== "Virtual" ? event.venue_details.name : "",
    venue_address: event?.venue_details?.address && event.venue_details.address !== "Online" ? event.venue_details.address : "",
    max_attendees: event?.max_attendees ? String(event.max_attendees) : "",
    isVirtual: event?.venue_details?.name === "Virtual" || event?.venue_details?.address === "Online",
    absorb_fees: event?.absorb_fees || false,
    ticketTypes: (event?.ticket_types as TicketType[]) || [
      { name: "General Admission", price: 0, description: "Basic entry to the event.", perks: [] as string[] }
    ] as TicketType[],
    imageFile: null as File | null,
    imagePreview: event?.featured_image || null as string | null,
  });

  const updateForm = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const addTicketType = () => {
    setFormData((prev) => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, { name: "", price: 0, description: "", perks: [] }]
    }));
  };

  const updateTicketType = <K extends keyof TicketType>(index: number, key: K, value: TicketType[K]) => {
    const newTickets = [...formData.ticketTypes];
    newTickets[index] = {
      ...newTickets[index],
      [key]: value
    };
    setFormData((prev) => ({ ...prev, ticketTypes: newTickets }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateForm("imageFile", file);
      updateForm("imagePreview", URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let featured_image_url = event?.featured_image || null;

      // 1. Upload Image (only if a new one is selected)
      if (formData.imageFile) {
        const fileExt = formData.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(fileName, formData.imageFile);

        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

        featured_image_url = supabase.storage.from("event-banners").getPublicUrl(fileName).data.publicUrl;
      }

      // 2. Insert or Update Event
      const eventPayload = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formData.description,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        venue_details: {
          name: formData.isVirtual ? "Virtual" : formData.venue_name,
          address: formData.isVirtual ? "Online" : formData.venue_address,
        },
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        ticket_types: formData.ticketTypes,
        featured_image: featured_image_url,
        absorb_fees: formData.absorb_fees,
        status: event?.status || "published",
      };

      if (event?.id) {
        // Update
        const { error: updateError } = await supabase
          .from("events")
          .update(eventPayload)
          .eq("id", event.id);

        if (updateError) throw new Error(updateError.message);
      } else {
        // Insert
        const { error: insertError } = await supabase.from("events").insert({
          ...eventPayload,
          organizer_id: user.id,
        });

        if (insertError) throw new Error(insertError.message);
      }

      router.push(`/organizer/events`);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <div 
              className={`h-full bg-indigo-500 transition-all duration-500 ${step >= s ? 'w-full' : 'w-0'}`} 
            />
          </div>
        ))}
      </div>

      <div className="glass-card p-8 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold font-heading mb-2">Basic Details</h2>
                <p className="text-zinc-400 text-sm">Let&apos;s start with the name and description.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-zinc-300">Event Title</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => updateForm("title", e.target.value)}
                    placeholder="E.g., Lagos Tech Summit 2026"
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-300">URL Slug (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.slug} 
                    onChange={(e) => updateForm("slug", e.target.value)}
                    placeholder="lagos-tech-summit-2026"
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-300">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="Describe your event..."
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date & Location */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold font-heading mb-2">Date & Location</h2>
                <p className="text-zinc-400 text-sm">When and where is it happening?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Calendar className="w-4 h-4"/> Start Date & Time</label>
                  <input 
                    id="start_date"
                    title="Start Date & Time"
                    placeholder="Start date and time"
                    type="datetime-local" 
                    value={formData.start_date} 
                    onChange={(e) => updateForm("start_date", e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Calendar className="w-4 h-4"/> End Date & Time</label>
                  <input 
                    id="end_date"
                    title="End Date & Time"
                    placeholder="End date and time"
                    type="datetime-local" 
                    value={formData.end_date} 
                    onChange={(e) => updateForm("end_date", e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isVirtual} 
                    onChange={(e) => updateForm("isVirtual", e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  This is a virtual event
                </label>

                {!formData.isVirtual && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-zinc-300 flex items-center gap-2"><MapPin className="w-4 h-4"/> Venue Name</label>
                      <input 
                        type="text" 
                        value={formData.venue_name} 
                        onChange={(e) => updateForm("venue_name", e.target.value)}
                        placeholder="E.g., Eko Convention Center"
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-zinc-300">Venue Address</label>
                      <input 
                        type="text" 
                        value={formData.venue_address} 
                        onChange={(e) => updateForm("venue_address", e.target.value)}
                        placeholder="Full address"
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold font-heading mb-2">Event Image</h2>
                <p className="text-zinc-400 text-sm">Upload a high-quality banner for your event.</p>
              </div>
              
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-indigo-500/50 transition-colors h-64">
                {formData.imagePreview ? (
                  <>
                    <Image src={formData.imagePreview} alt="Preview" fill className="object-cover opacity-50" />
                    <div className="relative z-10 bg-black/60 backdrop-blur-sm p-4 rounded-xl">
                      <p className="font-bold">Image selected</p>
                      <p className="text-xs text-zinc-400">Click to change</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="font-bold">Click to upload image</p>
                    <p className="text-sm text-zinc-500">PNG, JPG, WEBP up to 5MB</p>
                  </>
                )}
                <input 
                  type="file" 
                  id="event_banner"
                  title="Upload Event Banner"
                  aria-label="Upload Event Banner"
                  placeholder="Choose banner image"
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Step 4: Tickets */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-heading mb-2">Tickets</h2>
                  <p className="text-zinc-400 text-sm">Create your ticket tiers and pricing.</p>
                </div>
                <button 
                  onClick={addTicketType}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Tier
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {formData.ticketTypes.map((ticket, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4 relative">
                    {idx > 0 && (
                      <button 
                        title="Remove ticket tier"
                        aria-label="Remove ticket tier"
                        onClick={() => {
                          const newTickets = formData.ticketTypes.filter((_, i) => i !== idx);
                          setFormData(prev => ({ ...prev, ticketTypes: newTickets }));
                        }}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-400">Tier Name</label>
                        <input 
                          type="text" 
                          value={ticket.name} 
                          onChange={(e) => updateTicketType(idx, "name", e.target.value)}
                          placeholder="VIP"
                          className="w-full mt-1 bg-transparent border-b border-white/10 py-2 focus:border-indigo-500 outline-none text-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400">Price (₦)</label>
                        <input 
                          type="number" 
                          value={ticket.price} 
                          onChange={(e) => updateTicketType(idx, "price", parseFloat(e.target.value) || 0)}
                          placeholder="0 for Free"
                          className="w-full mt-1 bg-transparent border-b border-white/10 py-2 focus:border-indigo-500 outline-none text-lg font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400">Description</label>
                      <input 
                        type="text" 
                        value={ticket.description} 
                        onChange={(e) => updateTicketType(idx, "description", e.target.value)}
                        placeholder="What's included?"
                        className="w-full mt-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-bold text-zinc-300">Total Event Capacity (Optional)</label>
                <input 
                  type="number" 
                  value={formData.max_attendees} 
                  onChange={(e) => updateForm("max_attendees", e.target.value)}
                  placeholder="Leave blank for unlimited"
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="flex items-start gap-3 text-sm font-bold text-zinc-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.absorb_fees} 
                    onChange={(e) => updateForm("absorb_fees", e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div>
                    <span className="block">Absorb Platform Fees</span>
                    <span className="text-xs text-zinc-400 font-normal block mt-0.5">
                      If checked, platform fees will be deducted from your ticket payout (buyer pays only the ticket price). Otherwise, platform fees are added to the ticket price paid by the buyer.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold font-heading mb-2">Review & Publish</h2>
                <p className="text-zinc-400 text-sm">Check your details before making it live.</p>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold">{formData.title || "Untitled Event"}</h3>
                  <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4"/> 
                    {formData.start_date ? new Date(formData.start_date).toLocaleString() : "No date set"}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4"/> 
                    {formData.isVirtual ? "Virtual Event" : formData.venue_name || "No venue set"}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="font-bold mb-3 flex items-center gap-2"><Ticket className="w-4 h-4"/> Ticket Tiers</p>
                  <div className="space-y-2">
                    {formData.ticketTypes.map((t, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                        <span>{t.name || "Unnamed Tier"}</span>
                        <span className="font-bold text-indigo-400">
                          {t.price > 0 ? `₦${t.price.toLocaleString()}` : "Free"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="font-bold block mb-1">Fee Handling</span>
                    {formData.absorb_fees ? (
                      <span className="text-emerald-400">Absorbing platform fees. Buyers will pay only the face ticket price.</span>
                    ) : (
                      <span className="text-indigo-400">Buyers pay platform fees in addition to the ticket price.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/10">
          <button 
            onClick={handlePrev} 
            disabled={step === 1 || loading}
            className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Back
          </button>

          {step < 5 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
