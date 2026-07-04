"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCategory } from "@/lib/professionals/actions";
import { Plus, Tag, CheckCircle, AlertCircle } from "lucide-react";
import type { ProfessionalCategory } from "@/lib/professionals/types";

export default function AdminProfessionalCategoriesPage() {
  const [categories, setCategories] = useState<ProfessionalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "" });
  const update = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === "name") {
      setForm((p) => ({
        ...p,
        slug: v.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
      }));
    }
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("professional_categories")
        .select("*")
        .order("display_order", { ascending: true });
      setCategories((data ?? []) as ProfessionalCategory[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) { setError("Name and slug are required."); return; }
    setSaving(true);
    setError(null);
    const result = await createCategory({ name: form.name, slug: form.slug, description: form.description, icon: form.icon });
    setSaving(false);
    if (result.success) {
      setSuccess(true);
      setShowForm(false);
      setForm({ name: "", slug: "", description: "", icon: "" });
      // Reload categories
      const supabase = createClient();
      const { data } = await supabase.from("professional_categories").select("*").order("display_order");
      setCategories((data ?? []) as ProfessionalCategory[]);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? "Failed to create category.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white">Professional Categories</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage all professional categories. New categories appear immediately in the directory.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
          <CheckCircle className="w-4 h-4" /> Category created successfully!
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-zinc-900 dark:text-white">Create New Category</h3>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Wedding DJs" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Slug * (auto-generated)</label>
              <input type="text" value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="e.g. wedding-djs" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Icon (emoji)</label>
              <input type="text" value={form.icon} onChange={(e) => update("icon", e.target.value)} placeholder="🎧" maxLength={4} className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-2xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Short description of this category" className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60">
              {saving ? "Creating..." : "Create Category"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Category list */}
      {loading ? (
        <div className="text-zinc-400 text-sm">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="glass-card p-4 flex items-center gap-3">
              <span className="text-3xl flex-shrink-0">{cat.icon ?? "🎯"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{cat.name}</h3>
                  {cat.is_active && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 uppercase">Active</span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">/professionals/{cat.slug}</p>
                {cat.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{cat.description}</p>}
              </div>
              <Tag className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
