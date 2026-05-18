"use client";

import { useState } from "react";
import { 
  Percent, 
  ToggleLeft, 
  ToggleRight, 
  Megaphone, 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SystemSettings {
  platform_markup_fee: number;
  zero_fee_mode: boolean;
  global_announcement: string;
  enable_guest_checkout: boolean;
  enable_qr_sound: boolean;
}

interface SystemSettingsFormProps {
  initialSettings: SystemSettings;
}

export default function SystemSettingsForm({ initialSettings }: SystemSettingsFormProps) {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  const sqlDDL = `-- CREATE THE INFRASTRUCTURE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_configurations (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

-- ALLOW PUBLIC READING OF SYSTEM ANNOUNCEMENTS
CREATE POLICY "Allow public select of settings" ON public.system_configurations
  FOR SELECT USING (true);

-- RESTRICT WRITING EXCLUSIVELY TO SUPER ADMINS
CREATE POLICY "Allow super admins all actions" ON public.system_configurations
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- INSERT DEFAULT STARTING METRICS
INSERT INTO public.system_configurations (key, value)
VALUES 
  ('platform_markup', '{"percentage": 4.0, "zero_fee_mode": false}'::jsonb),
  ('general_configs', '{"global_announcement": "Enjoy zero platform charges on selected events!", "enable_guest_checkout": true, "enable_qr_sound": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;`;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Upsert Platform Markup configuration
      const { error: err1 } = await supabase
        .from("system_configurations")
        .upsert({
          key: "platform_markup",
          value: {
            percentage: Number(settings.platform_markup_fee),
            zero_fee_mode: settings.zero_fee_mode
          }
        });

      // Upsert General system configurations
      const { error: err2 } = await supabase
        .from("system_configurations")
        .upsert({
          key: "general_configs",
          value: {
            global_announcement: settings.global_announcement,
            enable_guest_checkout: settings.enable_guest_checkout,
            enable_qr_sound: settings.enable_qr_sound
          }
        });

      if (err1 || err2) {
        throw new Error(err1?.message || err2?.message || "Failed to update configurations row.");
      }

      setSuccessMsg("Global platform settings updated and persisted successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg(
        "Could not save to Supabase. This usually means the 'system_configurations' table is missing. Click the SQL table script below to set it up!"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopySql() {
    navigator.clipboard.writeText(sqlDDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-green-700 font-semibold shadow-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-red-700 font-semibold shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Platforms markup fee settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Platform Markup fee */}
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-6">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
              <Percent className="w-5 h-5 text-indigo-500" /> Global Platform Markup Fee
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="markup-fee-input" className="font-bold text-sm text-zinc-700">Platform Charge Percentage</label>
                  <p className="text-xs text-zinc-400">The commission rate automatically deducted from gross sales.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl font-bold font-mono text-zinc-750">
                  <input
                    id="markup-fee-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.platform_markup_fee}
                    onChange={(e) => setSettings({ ...settings, platform_markup_fee: Number(e.target.value) })}
                    className="w-12 bg-transparent text-right outline-none font-bold text-zinc-800 focus:text-indigo-600 transition-colors"
                  />
                  <span>%</span>
                </div>
              </div>

              {/* Styled Range Slider */}
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={settings.platform_markup_fee}
                onChange={(e) => setSettings({ ...settings, platform_markup_fee: Number(e.target.value) })}
                className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                aria-label="Platform Charge Percentage Slider"
              />

              <div className="border-t border-indigo-50 pt-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-zinc-700 block">Promotional Zero-Fee Mode</span>
                  <span className="text-xs text-zinc-400">Temporarily suspend all platform fees globally.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, zero_fee_mode: !settings.zero_fee_mode })}
                  className="focus:outline-none cursor-pointer"
                  aria-label="Toggle Promotional Zero-Fee Mode"
                >
                  {settings.zero_fee_mode ? (
                    <ToggleRight className="w-12 h-12 text-indigo-500 transition-transform active:scale-95" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-zinc-300 transition-transform active:scale-95" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Announcements */}
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-6">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
              <Megaphone className="w-5 h-5 text-indigo-500" /> Platform-wide Global Banner
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="announcement-input" className="text-sm font-bold text-zinc-700">Announcement Banner Message</label>
                <textarea
                  id="announcement-input"
                  value={settings.global_announcement}
                  onChange={(e) => setSettings({ ...settings, global_announcement: e.target.value })}
                  placeholder="Enter message to display across the header of all platform pages..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-indigo-500 outline-none transition-all text-sm resize-none font-medium text-zinc-750"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Feature Flags */}
        <div className="space-y-6">
          <div className="glass-card p-6 bg-white border border-[#E8EBE7] shadow-sm rounded-2xl space-y-6">
            <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2 border-b border-[#E8EBE7] pb-4">
              System Feature Flags
            </h2>

            <div className="space-y-4">
              {/* Flag 1 */}
              <div className="flex items-center justify-between py-2 border-b border-[#E8EBE7]">
                <div>
                  <span className="font-bold text-sm text-zinc-700 block">Guest Checkout</span>
                  <span className="text-xs text-zinc-400">Allow bookings without accounts.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enable_guest_checkout: !settings.enable_guest_checkout })}
                  className="focus:outline-none cursor-pointer"
                  aria-label="Toggle Guest Checkout"
                >
                  {settings.enable_guest_checkout ? (
                    <ToggleRight className="w-10 h-10 text-indigo-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-zinc-300" />
                  )}
                </button>
              </div>

              {/* Flag 2 */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-bold text-sm text-zinc-700 block">Camera Scan Audio</span>
                  <span className="text-xs text-zinc-400">Chime on successful scanner validation.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enable_qr_sound: !settings.enable_qr_sound })}
                  className="focus:outline-none cursor-pointer"
                  aria-label="Toggle Camera Scan Audio"
                >
                  {settings.enable_qr_sound ? (
                    <ToggleRight className="w-10 h-10 text-indigo-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-zinc-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer text-sm"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Save & Publish System Configs
          </button>
        </div>
      </form>

      {/* SQL Setup utility */}
      <div className="glass-card bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <button
          type="button"
          onClick={() => setShowSql(!showSql)}
          className="w-full flex items-center justify-between p-6 hover:bg-zinc-850/50 transition-colors text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="font-bold text-white block text-sm">Supabase Database SQL Creator</span>
              <span className="text-xs text-zinc-400">Show PostgreSQL script to initialize target configurations table.</span>
            </div>
          </div>
          <span className="text-xs text-indigo-400 font-bold hover:text-indigo-300">
            {showSql ? "Hide Script" : "Show Script"}
          </span>
        </button>

        {showSql && (
          <div className="p-6 border-t border-zinc-850 bg-zinc-950 font-mono text-xs text-zinc-300 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-550">Copy and paste this script in your Supabase SQL Editor:</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white font-bold text-zinc-400 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy SQL Code"}
              </button>
            </div>
            <pre className="overflow-x-auto bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 max-h-60 leading-relaxed scrollbar-thin select-all">
              {sqlDDL}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
