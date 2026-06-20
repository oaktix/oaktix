"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addPortfolioItem, deletePortfolioItem, updatePortfolioItem } from "@/lib/professionals/actions";
import { Plus, Trash2, Image, Film, ExternalLink, AlertCircle, CheckCircle, Upload, Pencil, X } from "lucide-react";
import type { ProfessionalPortfolio, Professional } from "@/lib/professionals/types";

type VideoPlatform = "youtube" | "instagram" | "tiktok" | "vimeo";

type VideoMeta = {
  platform: VideoPlatform;
  embedUrl: string | null; // null = cannot embed inline
  label: string;
} | null;

function parseVideoUrl(url: string): VideoMeta {
  if (!url) return null;

  // YouTube (watch, short, Shorts, embed)
  const ytMatch =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      label: "YouTube",
    };
  }

  // TikTok — full URL with video ID can be embedded
  const tikMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tikMatch) {
    return {
      platform: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/v2/${tikMatch[1]}`,
      label: "TikTok",
    };
  }
  if (/tiktok\.com/.test(url)) {
    return { platform: "tiktok", embedUrl: null, label: "TikTok" };
  }

  // Instagram — cannot be embedded (platform blocks iframes)
  if (/instagram\.com\/(reel|p)\//.test(url)) {
    return { platform: "instagram", embedUrl: null, label: "Instagram Reel" };
  }

  return null;
}

const MEDIA_TYPES = [
  { value: "image" as const, label: "Image", icon: Image },
  { value: "video" as const, label: "Video (YouTube / Instagram / TikTok)", icon: Film },
];

// Defined at module scope so React doesn't recreate it as a new component type on every render
function VideoPreview({ url }: { url: string }) {
  const meta = parseVideoUrl(url);
  if (!url) return null;
  if (!meta)
    return (
      <p className="text-xs text-red-500 flex items-center gap-1">
        ⚠ Unsupported link. Please use YouTube, Instagram Reel, or TikTok.
      </p>
    );

  const isPortrait = meta.platform === "tiktok";

  // Embeddable platforms — show inline preview
  if (meta.embedUrl) {
    return (
      <div className="rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-700">
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          {meta.label} preview
        </p>
        <div className={`w-full ${isPortrait ? "aspect-[9/16] max-h-72 max-w-[162px] mx-auto" : "aspect-video"}`}>
          <iframe
            src={meta.embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    );
  }

  // Non-embeddable (Instagram, TikTok short links)
  const emoji = meta.platform === "instagram" ? "📸" : "🎵";
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
      <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 text-xl">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{meta.label} link detected</p>
        {meta.platform === "instagram" && (
          <p className="text-[10px] text-zinc-400 mt-0.5">Instagram videos can't be embedded — clients will tap to open.</p>
        )}
        {meta.platform === "tiktok" && (
          <p className="text-[10px] text-zinc-400 mt-0.5">Use the full TikTok video URL (e.g. tiktok.com/@user/video/123…) for inline preview.</p>
        )}
        <p className="text-[10px] text-zinc-400 mt-1 truncate">{url}</p>
      </div>
    </div>
  );
}

export default function ProfessionalPortfolioPage() {
  const supabase = createClient();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [portfolio, setPortfolio] = useState<ProfessionalPortfolio[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    media_url: "",
    media_type: "image" as "image" | "video",
  });

  // Edit form
  const [editingItem, setEditingItem] = useState<ProfessionalPortfolio | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    media_url: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Shared state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  // ── Add item ────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;
    setError(null);
    if (!form.title) { setError("Title is required."); return; }
    if (form.media_type === "image" && !mediaFile) { setError("Please select an image file."); return; }
    if (form.media_type === "video" && !form.media_url) { setError("Please paste a video link."); return; }
    if (form.media_type === "video" && form.media_url && !parseVideoUrl(form.media_url)) {
      setError("Please use a YouTube, Instagram Reel, or TikTok link.");
      return;
    }

    setSaving(true);
    let finalMediaUrl = form.media_url;

    if (form.media_type === "image" && mediaFile) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? "anonymous";
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("portfolio-images").upload(fileName, mediaFile);
        if (uploadError) throw new Error(uploadError.message);
        finalMediaUrl = supabase.storage.from("portfolio-images").getPublicUrl(fileName).data.publicUrl;
      } catch (err) {
        setSaving(false);
        setError("Image upload failed: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }

    const videoMeta = form.media_type === "video" ? parseVideoUrl(finalMediaUrl) : null;
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

  // ── Open edit form ──────────────────────────────────────────
  const openEdit = (item: ProfessionalPortfolio) => {
    setEditingItem(item);
    setEditFile(null);
    setEditForm({
      title: item.title ?? "",
      description: item.description ?? "",
      media_url: item.video_url ?? item.image_url ?? "",
    });
    setShowForm(false);
    setError(null);
  };

  // ── Save edit ───────────────────────────────────────────────
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setError(null);
    if (!editForm.title) { setError("Title is required."); return; }

    if (editingItem.media_type === "video") {
      if (!editForm.media_url) { setError("Please paste a video link."); return; }
      if (!parseVideoUrl(editForm.media_url)) {
        setError("Please use a YouTube, Instagram Reel, or TikTok link.");
        return;
      }
    }

    setEditSaving(true);
    let updates: Parameters<typeof updatePortfolioItem>[1] = {
      title: editForm.title,
      description: editForm.description || undefined,
    };

    if (editingItem.media_type === "video") {
      const videoMeta = parseVideoUrl(editForm.media_url);
      updates = {
        ...updates,
        video_url: editForm.media_url,
        thumbnail_url: videoMeta?.thumbnailUrl ?? null,
      };
    } else if (editFile) {
      // Re-upload image
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id ?? "anonymous";
        const fileExt = editFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("portfolio-images").upload(fileName, editFile);
        if (uploadError) throw new Error(uploadError.message);
        updates.image_url = supabase.storage.from("portfolio-images").getPublicUrl(fileName).data.publicUrl;
      } catch (err) {
        setEditSaving(false);
        setError("Image upload failed: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }

    const result = await updatePortfolioItem(editingItem.id, updates);
    setEditSaving(false);
    if (result.success) {
      setSuccess("Item updated!");
      setEditingItem(null);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error ?? "Failed to update.");
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this item from your portfolio?")) return;
    setDeletingId(id);
    const result = await deletePortfolioItem(id);
    setDeletingId(null);
    if (result.success) {
      setPortfolio((prev) => prev.filter((p) => p.id !== id));
      if (editingItem?.id === id) setEditingItem(null);
    } else {
      alert(result.error ?? "Failed to delete.");
    }
  };

  // ── Loading / guard states ──────────────────────────────────
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
          <p className="text-zinc-500 text-sm mb-4">You need a professional profile before you can manage your portfolio.</p>
          <a href="/professionals/register" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all">
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
            Showcase your best work — images and videos. {portfolio.length}/20 items.
          </p>
        </div>
        {portfolio.length < 20 && !editingItem && (
          <button
            onClick={() => { setShowForm(!showForm); setError(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}

      {/* ── Edit form ─────────────────────────────────────────── */}
      {editingItem && (
        <form onSubmit={handleEdit} className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Pencil className="w-4 h-4 text-indigo-500" />
              Edit Portfolio Item
            </h3>
            <button type="button" onClick={() => { setEditingItem(null); setError(null); }} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Title *</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {editingItem.media_type === "video" ? (
              <div className="sm:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Video Link *</label>
                <input
                  type="url"
                  value={editForm.media_url}
                  onChange={(e) => setEditForm((p) => ({ ...p, media_url: e.target.value }))}
                  placeholder="Paste a YouTube, Instagram Reel, or TikTok link..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <VideoPreview url={editForm.media_url} />
                <p className="text-xs text-zinc-400">Supported: YouTube, Instagram Reels, TikTok</p>
              </div>
            ) : (
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Image</label>
                {/* Current image */}
                {editingItem.image_url && !editFile && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editingItem.image_url} alt="Current" className="w-full h-full object-cover" />
                    <p className="absolute bottom-2 left-2 text-[10px] text-white bg-black/50 px-2 py-0.5 rounded">Current image</p>
                  </div>
                )}
                {/* New file preview */}
                {editFile && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(editFile)} alt="New" className="w-full h-40 object-cover rounded-xl border border-zinc-200" />
                    <button type="button" onClick={() => setEditFile(null)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                  <Upload className="w-4 h-4" />
                  {editFile ? "Change image" : "Replace image"}
                  <input type="file" accept="image/*" className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setEditFile(f); }} />
                </label>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Description (optional)</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={editSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60">
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => { setEditingItem(null); setError(null); }}
              className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Add form ──────────────────────────────────────────── */}
      {showForm && !editingItem && (
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
                <button key={mt.value} type="button"
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
              <input type="text" value={form.title}
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
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Video Link *</label>
                <input type="url" value={form.media_url}
                  onChange={(e) => setForm((p) => ({ ...p, media_url: e.target.value }))}
                  placeholder="Paste a YouTube, Instagram Reel, or TikTok link..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <VideoPreview url={form.media_url} />
                <p className="text-xs text-zinc-400">Supported: YouTube, Instagram Reels, TikTok</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Description (optional)</label>
              <textarea value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Brief description of this work..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60">
              {saving ? "Adding..." : "Add to Portfolio"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null); setMediaFile(null); }}
              className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Portfolio Grid ─────────────────────────────────────── */}
      {portfolio.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Image className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">No portfolio items yet</h3>
          <p className="text-zinc-500 text-sm mb-4">Start showcasing your work. Add photos and videos to attract clients.</p>
          <button onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all">
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {portfolio.map((item) => {
            const isEditing = editingItem?.id === item.id;
            const thumbSrc = item.thumbnail_url ?? item.image_url;
            const openUrl = item.media_type === "video" ? (item.video_url ?? "") : (item.image_url ?? "");

            return (
              <div
                key={item.id}
                className={`rounded-2xl overflow-hidden border transition-all ${
                  isEditing
                    ? "border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-[#E8EBE7] dark:border-white/10"
                } bg-white dark:bg-zinc-900`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                  {thumbSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbSrc} alt={item.title ?? ""} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.media_type === "video"
                        ? <Film className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                        : <Image className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />}
                    </div>
                  )}
                  {/* Video type badge */}
                  {item.media_type === "video" && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white uppercase backdrop-blur-sm">
                        video
                      </span>
                    </div>
                  )}
                </div>

                {/* Always-visible action bar */}
                <div className="flex items-center gap-1 px-2 py-2 border-t border-[#E8EBE7] dark:border-white/10">
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1 min-w-0">
                    {item.title}
                  </p>
                  {/* Open link */}
                  {openUrl && (
                    <a href={openUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                      title="Open">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {/* Edit */}
                  <button onClick={() => openEdit(item)}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                      isEditing
                        ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    }`}
                    title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {/* Delete */}
                  <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                    className="flex-shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-40"
                    title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
            <span>Keep your portfolio fresh — update it after every major event.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
