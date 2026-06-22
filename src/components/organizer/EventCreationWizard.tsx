"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Plus, Trash2, MapPin, Calendar, Image as ImageIcon, Ticket } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap"),
  { ssr: false }
);

const DEFAULT_CATEGORIES = [
  "Concerts",
  "Conferences",
  "Festivals",
  "Sports",
  "Theatre",
  "Comedy",
  "Workshops",
  "Parties"
];

interface TicketType {
  name: string;
  price: number;
  early_bird_price?: number | null;
  early_bird_capacity?: number | null;
  description?: string;
  perks?: string[];
  is_closed?: boolean;
  capacity?: number;
  sold_count?: number;
  early_bird_until?: string;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  category?: string | null;
  start_date: string;
  end_date: string;
  venue_details?: {
    name?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  max_attendees?: number | null;
  ticket_types?: TicketType[] | null;
  featured_image?: string | null;
  absorb_fees?: boolean;
  status?: string;
  show_ticket_volume?: boolean;
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
  // Track whether the organiser has manually customised the slug so we don't
  // overwrite it when the title changes.
  const [slugManuallySet, setSlugManuallySet] = useState(!!(event?.slug));

  // Utility: convert any string into a URL-safe slug
  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // Form State
  const [formData, setFormData] = useState({
    title: event?.title || "",
    slug: event?.slug || "",
    description: event?.description || "",
    category: event?.category ? (DEFAULT_CATEGORIES.includes(event.category) ? event.category : "custom") : "Concerts",
    customCategory: event?.category && !DEFAULT_CATEGORIES.includes(event.category) ? event.category : "",
    start_date: event?.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "",
    end_date: event?.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "",
    venue_name: event?.venue_details?.name && event.venue_details.name !== "Virtual" ? event.venue_details.name : "",
    venue_address: event?.venue_details?.address && event.venue_details.address !== "Online" ? event.venue_details.address : "",
    latitude: event?.venue_details?.latitude || null as number | null,
    longitude: event?.venue_details?.longitude || null as number | null,
    max_attendees: event?.max_attendees ? String(event.max_attendees) : "",
    isVirtual: event?.venue_details?.name === "Virtual" || event?.venue_details?.address === "Online",
    absorb_fees: event?.absorb_fees || false,
    show_ticket_volume: event?.show_ticket_volume || false,
    ticketTypes: (event?.ticket_types?.map(t => ({ ...t, capacity: t.capacity ?? undefined, early_bird_until: t.early_bird_until ?? undefined, early_bird_capacity: t.early_bird_capacity ?? undefined })) as TicketType[]) || [
      { name: "General Admission", price: 0, early_bird_price: undefined, early_bird_capacity: undefined, description: "Basic entry to the event.", perks: [] as string[], capacity: undefined, early_bird_until: undefined }
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
      ticketTypes: [...prev.ticketTypes, { name: "", price: 0, early_bird_price: null, early_bird_capacity: null, description: "", perks: [] }]
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

    // Validation: start date cannot be in the past
    const now = new Date();
    const startDate = formData.start_date ? new Date(formData.start_date) : null;
    if (!startDate) throw new Error("Start date is required");
    if (startDate < now) throw new Error("Start date cannot be in the past");
    // If end date provided, it must be after start date
    const endDate = formData.end_date ? new Date(formData.end_date) : null;
    if (endDate && endDate < startDate) throw new Error("End date must be after start date");

    // Resolve and validate slug – always produce a URL-safe value
    const resolvedSlug =
      formData.slug ||
      formData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!resolvedSlug) {
      throw new Error("Event title is required to generate a URL slug.");
    }

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
      slug: resolvedSlug,
      description: formData.description,
      category: formData.category === "custom" ? formData.customCategory : formData.category,
      start_date: startDate.toISOString(),
      end_date: endDate ? endDate.toISOString() : null,
      venue_details: {
        name: formData.isVirtual ? "Virtual" : formData.venue_name,
        address: formData.isVirtual ? "Online" : formData.venue_address,
        latitude: formData.isVirtual ? null : formData.latitude,
        longitude: formData.isVirtual ? null : formData.longitude,
      },
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
      ticket_types: formData.ticketTypes,
      featured_image: featured_image_url,
      absorb_fees: formData.absorb_fees,
      status: event?.status || "published",
      show_ticket_volume: formData.show_ticket_volume,
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
          <div key={s} className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-white/5 overflow-hidden">
            <div className={`h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 ${step >= s ? 'w-full' : 'w-0'}`} 
            />
          </div>
        ))}
      </div>

      <div className="glass-card p-8 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold font-heading mb-2 text-zinc-900 dark:text-white">Basic Details</h2>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm">Let&apos;s start with the name and description.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      updateForm("title", newTitle);
                      // Auto-generate slug from title unless the organiser already
                      // customised it manually.
                      if (!slugManuallySet) {
                        updateForm("slug", toSlug(newTitle));
                      }
                    }}
                    placeholder="E.g., Lagos Tech Summit 2026"
                    className="w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    URL Slug <span className="text-zinc-400 font-normal">(auto-generated — edit to customise)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      // Sanitise on every keystroke so no invalid chars can enter
                      const sanitised = toSlug(e.target.value);
                      updateForm("slug", sanitised);
                      setSlugManuallySet(true);
                    }}
                    placeholder="lagos-tech-summit-2026"
                    className="w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 font-mono text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 outline-none"
                  />
                  {formData.slug && (
                    <p className="mt-1 text-[11px] text-zinc-500 font-mono">
                      Preview: <span className="text-indigo-500">/events/{formData.slug}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="Describe your event..."
                    className="w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 outline-none min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Event Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                    title="Event Category"
                    aria-label="Event Category"
                    className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-zinc-900 dark:text-white cursor-pointer font-medium"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium">{cat}</option>
                    ))}
                    <option value="custom" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold">+ Create Custom Category...</option>
                  </select>
                </div>
                {formData.category === "custom" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Custom Category Name</label>
                    <input 
                      type="text" 
                      value={formData.customCategory} 
                      onChange={(e) => updateForm("customCategory", e.target.value)}
                      placeholder="E.g., Art Exhibition, Gaming Tournament, Tech Meetup"
                      className="w-full mt-1 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Date & Location */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-2xl font-bold font-heading mb-2 text-zinc-900 dark:text-white">Date & Location</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">When and where is it happening?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="text-sm font-bold text-zinc-800 dark:text-zinc-300 flex items-center gap-2"><Calendar className="w-4 h-4"/> Start Date & Time</label>
                  <input 
                    id="start_date"
                    title="Start Date & Time"
                    placeholder="Start date and time"
                    type="datetime-local" 
                    value={formData.start_date} 
                    onChange={(e) => updateForm("start_date", e.target.value)}
                    className="w-full mt-1 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="text-sm font-bold text-zinc-800 dark:text-zinc-300 flex items-center gap-2"><Calendar className="w-4 h-4"/> End Date & Time</label>
                  <input 
                    id="end_date"
                    title="End Date & Time"
                    placeholder="End date and time"
                    type="datetime-local" 
                    value={formData.end_date} 
                    onChange={(e) => updateForm("end_date", e.target.value)}
                    className="w-full mt-1 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-white/10">
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-300 mb-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isVirtual} 
                    onChange={(e) => updateForm("isVirtual", e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  This is a virtual event
                </label>

                {!formData.isVirtual && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300 flex items-center gap-2"><MapPin className="w-4 h-4"/> Venue Name</label>
                      <input 
                        type="text" 
                        value={formData.venue_name} 
                        onChange={(e) => updateForm("venue_name", e.target.value)}
                        placeholder="E.g., Eko Convention Center"
                        className="w-full mt-1 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Venue Address</label>
                      <input 
                        type="text" 
                        value={formData.venue_address} 
                        onChange={(e) => updateForm("venue_address", e.target.value)}
                        placeholder="Full address"
                        className="w-full mt-1 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="pt-2">
                      <LocationPickerMap
                        lat={formData.latitude}
                        lng={formData.longitude}
                        onChange={(lat, lng, address) => {
                          updateForm("latitude", lat);
                          updateForm("longitude", lng);
                          updateForm("venue_address", address);
                        }}
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
                <h2 className="text-2xl font-bold font-heading mb-2 text-zinc-900 dark:text-white">Event Image</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Upload a high-quality banner for your event.</p>
              </div>
              
              <div className="border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-indigo-500/50 transition-colors h-64 bg-white/50 dark:bg-transparent">
                {formData.imagePreview ? (
                  <>
                    <Image src={formData.imagePreview} alt="Preview" fill className="object-cover opacity-50" />
                    <div className="relative z-10 bg-black/60 backdrop-blur-sm p-4 rounded-xl">
                      <p className="font-bold text-white">Image selected</p>
                      <p className="text-xs text-zinc-400">Click to change</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 text-indigo-600 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-white">Click to upload image</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">PNG, JPG, WEBP up to 5MB</p>
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
                  <h2 className="text-2xl font-bold font-heading mb-2 text-zinc-900 dark:text-white">Tickets</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm">Create your ticket tiers and pricing.</p>
                </div>
                <button 
                  onClick={addTicketType}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-white/10 text-indigo-700 dark:text-white text-sm font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Tier
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {formData.ticketTypes.map((ticket, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 space-y-4 relative">
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
                        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Tier Name</label>
                        <input 
                          type="text" 
                          value={ticket.name} 
                          onChange={(e) => updateTicketType(idx, "name", e.target.value)}
                          placeholder="VIP"
                          className="w-full mt-1 bg-transparent border-b border-zinc-300 dark:border-white/10 py-2 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-zinc-900 dark:text-white text-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Price (₦)</label>
                        <input 
                          type="number" 
                          value={ticket.price} 
                          onChange={(e) => updateTicketType(idx, "price", parseFloat(e.target.value) || 0)}
                          placeholder="0 for Free"
                          className="w-full mt-1 bg-transparent border-b border-zinc-300 dark:border-white/10 py-2 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-zinc-900 dark:text-white text-lg font-bold"
                        />
                        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mt-2">Early Bird Price (₦) (optional)</label>
                        <input 
                          type="number" 
                          value={ticket.early_bird_price ?? ''} 
                          onChange={(e) => updateTicketType(idx, "early_bird_price", e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="Leave blank if none"
                          className="w-full mt-1 bg-transparent border-b border-zinc-300 dark:border-white/10 py-2 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-zinc-900 dark:text-white text-lg font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Description</label>
                      <input 
                        type="text" 
                        value={ticket.description} 
                        onChange={(e) => updateTicketType(idx, "description", e.target.value)}
                        placeholder="What's included?"
                        className="w-full mt-1 bg-white dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Tier Capacity (Optional)</label>
                        <input 
                          type="number" 
                          value={ticket.capacity ?? ""} 
                          onChange={(e) => updateTicketType(idx, "capacity", e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Unlimited"
                          className="w-full mt-1 bg-white dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Early Bird Capacity (Optional)</label>
                        <input 
                          type="number" 
                          value={ticket.early_bird_capacity ?? ""} 
                          onChange={(e) => updateTicketType(idx, "early_bird_capacity", e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Unlimited"
                          className="w-full mt-1 bg-white dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Early Bird Sales End (Optional)</label>
                        <input 
                          type="datetime-local" 
                          value={ticket.early_bird_until ? new Date(ticket.early_bird_until).toISOString().slice(0, 16) : ""} 
                          onChange={(e) => updateTicketType(idx, "early_bird_until", e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                          className="w-full mt-1 bg-white dark:bg-black/20 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Total Event Capacity (Optional)</label>
                <input 
                  type="number" 
                  value={formData.max_attendees} 
                  onChange={(e) => updateForm("max_attendees", e.target.value)}
                  placeholder="Leave blank for unlimited"
                  className="w-full mt-1 bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 focus:border-indigo-600 dark:focus:border-indigo-500 text-zinc-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-white/10">
                <label className="flex items-start gap-3 text-sm font-bold text-zinc-800 dark:text-zinc-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.absorb_fees} 
                    onChange={(e) => updateForm("absorb_fees", e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div>
                    <span className="block">Absorb Platform Fees</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal block mt-0.5">
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
                <h2 className="text-2xl font-bold font-heading mb-2 text-zinc-900 dark:text-white">Review & Publish</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Check your details before making it live.</p>
              </div>
              
              <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20 p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{formData.title || "Untitled Event"}</h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                      Category: {formData.category === "custom" ? formData.customCategory || "Custom Category" : formData.category}
                    </span>
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-500"/> 
                    {formData.start_date ? new Date(formData.start_date).toLocaleString() : "No date set"}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-500"/> 
                    {formData.isVirtual ? "Virtual Event" : formData.venue_name || "No venue set"}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-white/10">
                  <p className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2"><Ticket className="w-4 h-4"/> Ticket Tiers</p>
                  <div className="space-y-2">
                    {formData.ticketTypes.map((t, i) => {
                      const capacityText = t.capacity ? ` (Cap: ${t.capacity})` : "";
                      const ebText = t.early_bird_until ? ` (Early Bird Ends: ${new Date(t.early_bird_until).toLocaleDateString()})` : "";
                      return (
                        <div key={i} className="flex justify-between items-center text-sm p-3 rounded border border-zinc-200 dark:border-transparent bg-white dark:bg-white/5">
                          <div>
                            <span className="font-medium text-zinc-900 dark:text-white">{t.name || "Unnamed Tier"}</span>
                            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block mt-0.5">{t.description || "No description"} {capacityText}{ebText}</span>
                          </div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {t.price > 0 ? `₦${t.price.toLocaleString()}` : "Free"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white block mb-1">Fee Handling</span>
                    {formData.absorb_fees ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Absorbing platform fees. Buyers will pay only the face ticket price.</span>
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400">Buyers pay platform fees in addition to the ticket price.</span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10">
                    <label className="flex items-start gap-3 text-sm font-bold text-zinc-800 dark:text-zinc-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.show_ticket_volume} 
                        onChange={(e) => updateForm("show_ticket_volume", e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <div>
                        <span className="block">Show Ticket Volume Publicly</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal block mt-0.5">
                          If checked, the remaining number of tickets for limited tiers will be displayed to buyers (e.g. "Only 5 left").
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-zinc-200 dark:border-white/10">
          <button 
            onClick={handlePrev} 
            disabled={step === 1 || loading}
            className="px-6 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Back
          </button>

          {step < 5 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
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
