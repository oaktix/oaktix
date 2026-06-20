"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfessionalProfile } from "@/lib/professionals/actions";
import { Save, CheckCircle, AlertCircle, Upload } from "lucide-react";
import type { Professional } from "@/lib/professionals/types";
import { NIGERIAN_STATES, PRICING_TYPE_LABELS } from "@/lib/professionals/types";

export default function ProfessionalSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    professional_name: "",
    business_name: "",
    headline: "",
    bio: "",
    years_of_experience: 0,
    city: "",
    state: "",
    pricing_type: "negotiable",
    starting_price: "",
    profile_photo: "",
    cover_image: "",
    phone: "",
    email: "",
    whatsapp: "",
    website: "",
    instagram: "",
    facebook: "",
    twitter: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("professionals")
        .select("*, category:professional_categories(id, name, slug, icon)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) { router.push("/professional"); return; }

      setProfessional(data as Professional);
      setForm({
        professional_name: data.professional_name ?? "",
        business_name: data.business_name ?? "",
        headline: data.headline ?? "",
        bio: data.bio ?? "",
        years_of_experience: data.years_of_experience ?? 0,
        city: data.city ?? "",
        state: data.state ?? "",
        pricing_type: data.pricing_type ?? "negotiable",
        starting_price: data.starting_price ? String(data.starting_price) : "",
        profile_photo: data.profile_photo ?? "",
        cover_image: data.cover_image ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        whatsapp: data.whatsapp ?? "",
        website: data.website ?? "",
        instagram: data.instagram ?? "",
        facebook: data.facebook ?? "",
        twitter: data.twitter ?? "",
        tiktok: data.tiktok ?? "",
        youtube: data.youtube ?? "",
        linkedin: data.linkedin ?? "",
      });
      setLoading(false);
    }
    load();
  }, [router]);

  const update = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!professional) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Use local overrides for newly uploaded URLs so we don't depend on async setState
    let uploadedProfilePhoto = form.profile_photo;
    let uploadedCoverImage = form.cover_image;

    if (profilePhotoFile || coverImageFile) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? "anonymous";

        if (profilePhotoFile) {
          const fileExt = profilePhotoFile.name.split(".").pop();
          const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("professional-images")
            .upload(fileName, profilePhotoFile);
          if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
          uploadedProfilePhoto = supabase.storage.from("professional-images").getPublicUrl(fileName).data.publicUrl;
          setForm((p) => ({ ...p, profile_photo: uploadedProfilePhoto }));
          setProfilePhotoFile(null);
        }

        if (coverImageFile) {
          const fileExt = coverImageFile.name.split(".").pop();
          const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("professional-images")
            .upload(fileName, coverImageFile);
          if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
          uploadedCoverImage = supabase.storage.from("professional-images").getPublicUrl(fileName).data.publicUrl;
          setForm((p) => ({ ...p, cover_image: uploadedCoverImage }));
          setCoverImageFile(null);
        }
      } catch (err) {
        setSaving(false);
        setError("Image upload failed: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }

    const result = await updateProfessionalProfile(professional.id, {
      ...form,
      profile_photo: uploadedProfilePhoto,
      cover_image: uploadedCoverImage,
      years_of_experience: Number(form.years_of_experience),
      starting_price: form.starting_price ? Number(form.starting_price) : undefined,
    } as Parameters<typeof updateProfessionalProfile>[1]);

    setSaving(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? "Failed to save changes.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-500">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white">Profile Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Update your public professional profile</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-md shadow-indigo-500/10"
        >
          {saving ? <span className="animate-pulse">Saving...</span> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
          <CheckCircle className="w-4 h-4" /> Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Identity */}
      <Section title="Professional Identity">
        <Field label="Professional Name *">
          <input type="text" value={form.professional_name} onChange={(e) => update("professional_name", e.target.value)} className="input" />
        </Field>
        <Field label="Business Name">
          <input type="text" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} className="input" placeholder="Optional" />
        </Field>
        <Field label="Headline *" className="sm:col-span-2">
          <input type="text" value={form.headline} onChange={(e) => update("headline", e.target.value)} maxLength={120} className="input" />
        </Field>
        <Field label="Bio" className="sm:col-span-2">
          <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={5} className="input resize-none" />
        </Field>
      </Section>

      {/* Location & Pricing */}
      <Section title="Location & Pricing">
        <Field label="City">
          <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} className="input" />
        </Field>
        <Field label="State">
          <select value={form.state} onChange={(e) => update("state", e.target.value)} className="input">
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Years of Experience">
          <input type="number" value={form.years_of_experience} onChange={(e) => update("years_of_experience", e.target.value)} min={0} max={50} className="input" />
        </Field>
        <Field label="Pricing Type">
          <select value={form.pricing_type} onChange={(e) => update("pricing_type", e.target.value)} className="input">
            {Object.entries(PRICING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        {form.pricing_type !== "negotiable" && (
          <Field label="Starting Price (₦)" className="sm:col-span-2">
            <input type="number" value={form.starting_price} onChange={(e) => update("starting_price", e.target.value)} min={0} placeholder="e.g. 50000" className="input" />
          </Field>
        )}
      </Section>

      {/* Images */}
      <Section title="Profile Images">
        {/* Profile Photo */}
        <Field label="Profile Photo" className="sm:col-span-2">
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center gap-3">
            {(profilePhotoFile || form.profile_photo) ? (
              <div className="relative w-24 h-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profilePhotoFile ? URL.createObjectURL(profilePhotoFile) : form.profile_photo}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <button type="button" onClick={() => { setProfilePhotoFile(null); update("profile_photo", ""); }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Upload className="w-8 h-8 text-zinc-400" />
              </div>
            )}
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-500/20 transition-colors">
              {profilePhotoFile ? "Change Photo" : "Upload Photo"}
              <input type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setProfilePhotoFile(f); }} />
            </label>
            <p className="text-xs text-zinc-400">JPG, PNG, WebP up to 5MB</p>
          </div>
        </Field>

        {/* Cover Image */}
        <Field label="Cover Image" className="sm:col-span-2">
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center gap-3">
            {(coverImageFile || form.cover_image) ? (
              <div className="relative w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageFile ? URL.createObjectURL(coverImageFile) : form.cover_image}
                  alt="Cover preview"
                  className="w-full h-24 object-cover rounded-xl"
                />
                <button type="button" onClick={() => { setCoverImageFile(null); update("cover_image", ""); }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
              </div>
            ) : (
              <div className="w-full h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Upload className="w-8 h-8 text-zinc-400" />
              </div>
            )}
            <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-500/20 transition-colors">
              {coverImageFile ? "Change Cover" : "Upload Cover"}
              <input type="file" accept="image/*" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setCoverImageFile(f); }} />
            </label>
            <p className="text-xs text-zinc-400">JPG, PNG, WebP up to 5MB</p>
          </div>
        </Field>
      </Section>

      {/* Contact */}
      <Section title="Contact Information">
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." className="input" />
        </Field>
        <Field label="WhatsApp">
          <input type="tel" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+234..." className="input" />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input" />
        </Field>
        <Field label="Website">
          <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." className="input" />
        </Field>
      </Section>

      {/* Social */}
      <Section title="Social Media">
        {[
          { key: "instagram", label: "Instagram", placeholder: "@yourusername" },
          { key: "tiktok", label: "TikTok", placeholder: "@yourtiktok" },
          { key: "facebook", label: "Facebook", placeholder: "Profile URL" },
          { key: "youtube", label: "YouTube", placeholder: "Channel URL" },
          { key: "twitter", label: "Twitter / X", placeholder: "@handle" },
          { key: "linkedin", label: "LinkedIn", placeholder: "Profile URL" },
        ].map(({ key, label, placeholder }) => (
          <Field key={key} label={label}>
            <input type="text" value={String((form as Record<string, unknown>)[key])} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} className="input" />
          </Field>
        ))}
      </Section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-md shadow-indigo-500/10"
        >
          {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save All Changes</>}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1px solid #dce3df;
          background: white;
          font-size: 0.875rem;
          color: #1a1a1a;
          outline: none;
          transition: all 0.15s;
        }
        .dark .input {
          border-color: rgba(255,255,255,0.1);
          background: #212f26;
          color: #f4f4f5;
        }
        .input:focus {
          border-color: rgba(14,75,49,0.5);
          box-shadow: 0 0 0 3px rgba(14,75,49,0.1);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-5 pb-3 border-b border-[#E8EBE7] dark:border-white/5">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
