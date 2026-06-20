"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addPortfolioItem, deletePortfolioItem } from "@/lib/professionals/actions";
import { Plus, Trash2, Image, Film, ExternalLink, AlertCircle, CheckCircle, Upload } from "lucide-react";
import type { ProfessionalPortfolio, Professional } from "@/lib/professionals/types";

type VideoMeta = {
  platform: 'youtube' | 'instagram' | 'tiktok';
  thumbnailUrl: string | null;
  label: string;
} | null;

function parseVideoUrl(url: string): VideoMeta {
  if (!url) return null;
  // YouTube: watch?v=, youtu.be/, /shorts/, /embed/
  const ytMatch =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      platform: 'youtube',
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
      label: 'YouTube',
    };
  }
  // Instagram Reels or posts
  if (/instagram\.com\/(reel|p)\//.test(url)) {
    return { platform: 'instagram', thumbnailUrl: null, label: 'Instagram Reel' };
  }
  // TikTok
  if (/tiktok\.com/.test(url)) {
    return { platform: 'tiktok', thumbnailUrl: null, label: 'TikTok' };
  }
  return null;
}

// Only 'image' and 'video' are supported in the DB schema
const MEDIA_TYPES = [
  { value: "image" as const, label: "Image", icon: Image },
  { value: "video" as const, label: "Video (YouTube/Vimeo)", icon: Film },
];

export default function ProfessionalPortfolioPage() {
  const supabase = createClient();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [portfolio, setPortfolio] = useState<ProfessionalPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    media_url: "",
    media_type: "image" as "image" | "video",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from("professionals")
      .select("id, professional_name, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!prof) {
      setLoading(false);
      return;
    }

    setProfessional(prof as unknown as Professional);

    const { data: items } = await supabase
      .from("professional_portfolio")
      .select("*")
      .eq("professional_id", prof.id)
      .order("display_order", { ascending: true });

    setPortfolio((items ?? []) as ProfessionalPortfolio[]);
    setLoading(false);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;
    if (!form.title) {
      setError("Title is required.");
      return;
    }

    // For image type, require a file; for video, require a URL
    if (form.media_type === "image" && !mediaFile) {
      setError("Please select an image file.");
      return;
    }
    if (form.media_type !== "image" && !form.media_url) {
      setError("Title and media URL are required.");
      return;
    }
    if (form.media_type !== "image" && form.media_url && !parseVideoUrl(form.media_url)) {
      setError("Please use a YouTube, Instagram Reel, or TikTok link.");
      return;
    }

    setSaving(true);
    setError(null);

    let finalMediaUrl = form.media_url;

    if (form.media_type === "image" && mediaFile) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? "anonymous";
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(fileName, mediaFile);
        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
        finalMediaUrl = supabase.storage.from("portfolio-images").getPublicUrl(fileName).data.publicUrl;
      } catch (err) {
        setSaving(false);
        setError("Image upload failed: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }

    const videoMeta = form.media_type !== "image" ? parseVideoUrl(finalMediaUrl) : null;
    const result = await addPortfolioItem(professional.id, {
      title: form.title,
      description: form.description || undefined,
      media_url: finalMediaUrl,
      thumbnail_url: videoMeta?.thumbnailUrl ?? undefined,
      media_type: form.media_type,
    });

    setSaving(false);
    if (result.success) {
      setSuccess("Portfolio item added!");
      setShowForm(false);
      setMediaFile(null);
      setForm({ title: "", description: "", media_url: "", media_type: "image" });
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error ?? "Failed to add item.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this item from your portfolio?")) return;
    setDeletingId(id);
    const result = await deletePortfolioItem(id);
    setDeletingId(null);
    if (result.success) {
      setPortfolio((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(result.error ?? "Failed to delete.");
    }
  };

  const mediaIcon = (type: string) => {
    const cfg: Record<string, React.ReactNode> = {
      image: <Image className="w-4 h-4" />,
      video: <Film className="w-4 h-4" />,
    };
    return cfg[type] ?? <Image className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="p-6 md:p-8 max-w-xl">
        <div className="glass-card p-8 text-center">
          <Image className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h2 className="font-bold text-zinc-900 dark:text-white mb-2">No Professional Profile</h2>
          <p className="text-zinc-500 text-sm mb-4">
            You need a professional profile before you can manage your portfolio.
          </p>
          <a
            href="/professionals/register"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
          >
            Create Profile
          </a>
        </div>
      </div>
    );
  }

  if (professional.status !== "approved") {
    return (
      <div className="p-6 md:p-8 max-w-xl">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="font-bold text-zinc-900 dark:text-white mb-2">Profile Pending Approval</h2>
          <p className="text-zinc-500 text-sm">
            Your profile is currently <strong>{professional.status}</strong>. You can manage your portfolio once it&apos;s approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white">Portfolio</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Showcase your best work — images, videos, and more. {portfolio.length}/20 items.
          </p>
        </div>
        {portfolio.length < 20 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-zinc-900 dark:text-white">Add Portfolio Item</h3>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Media Type */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Media Type</label>
            <div className="flex flex-wrap gap-2">
              {MEDIA_TYPES.map((mt) => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, media_type: mt.value }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    form.media_type === mt.value
                      ? "bg-indigo-500 text-white"
                      : "border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <mt.icon className="w-4 h-4" />
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. DJ Set at Lagos Carnival 2024"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {form.media_type === "image" ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Image File *</label>
                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                  {mediaFile ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <button type="button" onClick={() => setMediaFile(null)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                      <Upload className="w-8 h-8 text-zinc-400" />
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Click to upload image</span>
                      <span className="text-xs text-zinc-400">JPG, PNG, WebP up to 10MB</span>
                      <input type="file" accept="image/*" className="sr-only"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setMediaFile(f); }} />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div className="sm:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Video Link *
                </label>
                <input
                  type="url"
                  value={form.media_url}
                  onChange={(e) => setForm(p => ({ ...p, media_url: e.target.value }))}
                  placeholder="Paste a YouTube, Instagram Reel, or TikTok link..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {/* Detection feedback */}
                {(() => {
                  const meta = parseVideoUrl(form.media_url);
                  if (!form.media_url) return null;
                  if (!meta) {
                    return (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        ⚠ Unsupported link. Please use YouTube, Instagram Reel, or TikTok.
                      </p>
                    );
                  }
                  return (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      {meta.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={meta.thumbnailUrl} alt="Video thumbnail" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-24 h-16 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 text-2xl">
                          {meta.platform === 'instagram' ? '📸' : '🎵'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{meta.label} detected</p>
                        <p className="text-xs text-zinc-500 mt-1 break-all">{form.media_url}</p>
                      </div>
                    </div>
                  );
                })()}
                <p className="text-xs text-zinc-400">Supported: YouTube, Instagram Reels, TikTok</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Brief description of this work..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add to Portfolio"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); setMediaFile(null); }}
              className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Portfolio Grid */}
      {portfolio.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Image className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">No portfolio items yet</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Start showcasing your work. Add photos, videos, or other media to attract clients.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {portfolio.map((item) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-[#E8EBE7] dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 aspect-square">
              {/* Thumbnail */}
              {item.thumbnail_url || item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail_url ?? item.image_url ?? ""}
                  alt={item.title ?? ""}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  {mediaIcon(item.media_type)}
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <a
                  href={item.media_type === "video" ? (item.video_url ?? "") : (item.image_url ?? "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                  title="Open"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-all disabled:opacity-50"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Badge for video */}
              {item.media_type !== "image" && (
                <div className="absolute top-2 left-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white uppercase backdrop-blur-sm">
                    {item.media_type}
                  </span>
                </div>
              )}

              {/* Title at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-[11px] text-white font-medium line-clamp-1">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-3">Portfolio Tips</h3>
        <ul className="space-y-2 text-sm text-zinc-500">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
            <span>Add at least 5–8 high-quality photos from real events you&apos;ve worked.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
            <span>Include video highlights — clients who see videos book 3× more often.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
            <span>Use descriptive titles that mention the event type and city.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
            <span>Mark your best piece as &quot;Featured&quot; — it&apos;ll appear first in your gallery.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
