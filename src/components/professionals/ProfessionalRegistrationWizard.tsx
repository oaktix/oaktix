"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Upload, User, Briefcase, Image } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createProfessionalProfile } from "@/lib/professionals/actions";
import type { ProfessionalCategory } from "@/lib/professionals/types";
import { NIGERIAN_STATES, EVENT_TYPES } from "@/lib/professionals/types";

interface ProfessionalRegistrationWizardProps {
  categories: ProfessionalCategory[];
}

const STEPS = [
  { title: "Professional Info", icon: User, description: "Tell us about your work" },
  { title: "Details & Location", icon: Briefcase, description: "Your experience and pricing" },
  { title: "Portfolio & Social", icon: Image, description: "Showcase your work" },
];

export default function ProfessionalRegistrationWizard({
  categories,
}: ProfessionalRegistrationWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Step 1 — Professional Identity
  const [professionalName, setProfessionalName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  // Step 2 — Experience & Location
  const [yearsExp, setYearsExp] = useState(1);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pricingType, setPricingType] = useState<"fixed" | "hourly" | "per_event" | "negotiable">("negotiable");
  const [startingPrice, setStartingPrice] = useState("");

  // Step 3 — Portfolio & Social
  const [profilePhoto, setProfilePhoto] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");

  const validateStep = (): boolean => {
    setError(null);
    if (step === 0) {
      if (!professionalName.trim()) { setError("Please enter your professional name."); return false; }
      if (!categoryId) { setError("Please select your category."); return false; }
      if (!headline.trim()) { setError("Please add a short headline."); return false; }
      if (!bio.trim() || bio.length < 50) { setError("Please write a bio of at least 50 characters."); return false; }
    }
    if (step === 1) {
      if (!city.trim()) { setError("Please enter your city."); return false; }
      if (!state) { setError("Please select your state."); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 0));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Use local vars to hold final image URLs so we don't depend on async state updates
    let finalProfilePhoto = profilePhoto;
    let finalCoverImage = coverImage;

    if (profilePhotoFile || coverImageFile) {
      setUploadingPhoto(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? "anonymous";

        if (profilePhotoFile) {
          const fileExt = profilePhotoFile.name.split(".").pop();
          const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("professional-images")
            .upload(fileName, profilePhotoFile);
          if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
          finalProfilePhoto = supabase.storage.from("professional-images").getPublicUrl(fileName).data.publicUrl;
          setProfilePhoto(finalProfilePhoto);
        }

        if (coverImageFile) {
          const fileExt = coverImageFile.name.split(".").pop();
          const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("professional-images")
            .upload(fileName, coverImageFile);
          if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
          finalCoverImage = supabase.storage.from("professional-images").getPublicUrl(fileName).data.publicUrl;
          setCoverImage(finalCoverImage);
        }
      } catch (err) {
        setUploadingPhoto(false);
        setLoading(false);
        setError("Image upload failed: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
      setUploadingPhoto(false);
    }

    const result = await createProfessionalProfile(
      {
        professional_name: professionalName,
        business_name: businessName || undefined,
        category_id: categoryId,
        headline,
        bio,
        years_of_experience: yearsExp,
        city,
        state,
        pricing_type: pricingType,
        starting_price: startingPrice ? Number(startingPrice) : undefined,
      },
      {
        profile_photo: finalProfilePhoto || undefined,
        cover_image: finalCoverImage || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        twitter: twitter || undefined,
        youtube: youtube || undefined,
        tiktok: tiktok || undefined,
        website: website || undefined,
      }
    );

    setLoading(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white mb-3">
          Profile Submitted!
        </h2>
        <p className="text-zinc-500 mb-6 leading-relaxed">
          Your professional profile has been submitted for review. Our team will review your application and you will be notified once approved. This typically takes 1–2 business days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/professionals")}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
          >
            Browse Professionals
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-10 px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone
                      ? "bg-indigo-500 border-indigo-500"
                      : isActive
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isActive ? "text-indigo-500" : "text-zinc-400"}`} />
                  )}
                </div>
                <div className="mt-1.5 text-center hidden sm:block">
                  <p className={`text-xs font-bold ${isActive ? "text-indigo-500" : isDone ? "text-zinc-500" : "text-zinc-400"}`}>
                    {s.title}
                  </p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 mt-[-1rem] sm:mt-[-1.8rem] transition-colors ${i < step ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="glass-card p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading text-zinc-900 dark:text-white">
            {STEPS[step].title}
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">{STEPS[step].description}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* STEP 0 — Professional Identity */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-style">Professional Name *</label>
                <input
                  type="text"
                  value={professionalName}
                  onChange={(e) => setProfessionalName(e.target.value)}
                  placeholder="e.g. DJ Mighty, MC John"
                  className="input-style"
                />
                <p className="text-[11px] text-zinc-400 mt-1">This is your public display name</p>
              </div>
              <div>
                <label className="label-style">Business Name (optional)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your company or brand name"
                  className="input-style"
                />
              </div>
            </div>

            <div>
              <label className="label-style">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-style"
              >
                <option value="">Select your category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-style">Professional Headline *</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Award-winning DJ with 8 years of experience in Lagos"
                maxLength={120}
                className="input-style"
              />
              <p className="text-[11px] text-zinc-400 mt-1">{120 - headline.length} characters remaining</p>
            </div>

            <div>
              <label className="label-style">Bio *</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell event organisers about yourself, your experience, specialties, and what makes you unique..."
                rows={5}
                className="input-style resize-none leading-relaxed"
              />
              <p className="text-[11px] text-zinc-400 mt-1">{bio.length} characters (minimum 50)</p>
            </div>
          </div>
        )}

        {/* STEP 1 — Details & Location */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-style">Years of Experience *</label>
                <input
                  type="number"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(Number(e.target.value))}
                  min={0}
                  max={50}
                  className="input-style"
                />
              </div>
              <div>
                <label className="label-style">Pricing Type</label>
                <select
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value as typeof pricingType)}
                  className="input-style"
                >
                  <option value="negotiable">Negotiable</option>
                  <option value="fixed">Fixed Price</option>
                  <option value="per_event">Per Event</option>
                  <option value="hourly">Per Hour</option>
                </select>
              </div>

              {pricingType !== "negotiable" && (
                <div className="sm:col-span-2">
                  <label className="label-style">Starting Price (₦)</label>
                  <input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="e.g. 50000"
                    min={0}
                    className="input-style"
                  />
                </div>
              )}

              <div>
                <label className="label-style">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Your city"
                  className="input-style"
                />
              </div>

              <div>
                <label className="label-style">State *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input-style"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">💡 Pricing Tip</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Setting a starting price helps clients quickly gauge if you fit their budget. You can always negotiate. Most professionals on OakTix see 2x more inquiries with a visible price range.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2 — Portfolio & Social */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-[#E8EBE7] dark:border-white/5 rounded-xl">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Profile Images
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profile Photo */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Profile Photo</label>
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center gap-3">
                    {(profilePhotoFile || profilePhoto) ? (
                      <div className="relative w-24 h-24">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={profilePhotoFile ? URL.createObjectURL(profilePhotoFile) : profilePhoto}
                          alt="Profile preview"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                        <button type="button" onClick={() => { setProfilePhotoFile(null); setProfilePhoto(""); }}
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
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Cover Image</label>
                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center gap-3">
                    {(coverImageFile || coverImage) ? (
                      <div className="relative w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImageFile ? URL.createObjectURL(coverImageFile) : coverImage}
                          alt="Cover preview"
                          className="w-full h-24 object-cover rounded-xl"
                        />
                        <button type="button" onClick={() => { setCoverImageFile(null); setCoverImage(""); }}
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
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Social Media (optional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Instagram", value: instagram, set: setInstagram, placeholder: "@yourusername" },
                  { label: "TikTok", value: tiktok, set: setTiktok, placeholder: "@yourtiktok" },
                  { label: "Facebook", value: facebook, set: setFacebook, placeholder: "Profile or page URL" },
                  { label: "YouTube", value: youtube, set: setYoutube, placeholder: "Channel URL" },
                  { label: "Twitter / X", value: twitter, set: setTwitter, placeholder: "@yourhandle" },
                  { label: "Website", value: website, set: setWebsite, placeholder: "https://yourwebsite.com" },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="label-style">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder={placeholder}
                      className="input-style"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
              <p className="text-xs font-bold text-amber-600 mb-1">📸 Portfolio Upload</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                After your profile is approved, you can upload portfolio images and videos directly from your professional dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E8EBE7] dark:border-white/8">
          {step > 0 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/10"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-md shadow-amber-500/10 disabled:opacity-60"
            >
              {uploadingPhoto ? "Uploading images..." : loading ? "Submitting..." : (
                <><CheckCircle className="w-4 h-4" /> Submit Profile for Review</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Global CSS classes used inside this component */}
      <style jsx global>{`
        .label-style {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64786b;
          margin-bottom: 0.25rem;
        }
        .input-style {
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
        .dark .input-style {
          border-color: rgba(255,255,255,0.1);
          background: #212f26;
          color: #f4f4f5;
        }
        .input-style:focus {
          ring: 2px;
          border-color: rgba(14, 75, 49, 0.5);
          box-shadow: 0 0 0 3px rgba(14, 75, 49, 0.1);
        }
      `}</style>
    </div>
  );
}
