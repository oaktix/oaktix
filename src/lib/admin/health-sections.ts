import type { SupabaseClient } from "@supabase/supabase-js";

export type StatItem = {
  label: string;
  value: string | number;
  sub?: string;
  status?: "ok" | "warning" | "alert";
};

export type HealthSection = {
  id: string;
  title: string;
  href: string;
  icon: string; // emoji for server-component compatibility
  superAdminOnly?: boolean;
  fetchStats: (supabase: SupabaseClient) => Promise<StatItem[]>;
};

export const ADMIN_SECTIONS: HealthSection[] = [
  {
    id: "transactions",
    title: "Transactions & Revenue",
    href: "/admin/transactions",
    icon: "💳",
    fetchStats: async (supabase) => {
      const { data } = await supabase.rpc("dashboard_stats");
      const s = (Array.isArray(data) ? data[0] : data) as { gmv?: number; platform_fee?: number; vendor_net?: number } | null;
      const { count: pending } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const p = pending ?? 0;
      return [
        { label: "Total GMV", value: `₦${(s?.gmv ?? 0).toLocaleString()}` },
        { label: "Platform Fee", value: `₦${(s?.platform_fee ?? 0).toLocaleString()}` },
        { label: "Vendor Net", value: `₦${(s?.vendor_net ?? 0).toLocaleString()}` },
        { label: "Pending", value: p, status: p > 0 ? "warning" : "ok" },
      ];
    },
  },
  {
    id: "users",
    title: "Users",
    href: "/admin/users",
    icon: "👥",
    superAdminOnly: true,
    fetchStats: async (supabase) => {
      const { count: total } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      const { count: vendors } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor");
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: newThisWeek } = await supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo);
      return [
        { label: "Total Accounts", value: total ?? 0 },
        { label: "Organizers", value: vendors ?? 0 },
        { label: "New This Week", value: newThisWeek ?? 0 },
      ];
    },
  },
  {
    id: "vendors",
    title: "Vendors",
    href: "/admin/vendors",
    icon: "🏪",
    fetchStats: async (supabase) => {
      const { count: total } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor");
      const { count: pending } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor").eq("vendor_verified", false);
      const p = pending ?? 0;
      return [
        { label: "Total Vendors", value: total ?? 0 },
        { label: "Pending Verification", value: p, status: p > 0 ? "warning" : "ok" },
      ];
    },
  },
  {
    id: "events",
    title: "Events",
    href: "/admin/events",
    icon: "📅",
    fetchStats: async (supabase) => {
      const { count: total } = await supabase.from("events").select("id", { count: "exact", head: true });
      const { count: live } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published");
      const { count: draft } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "draft");
      const l = live ?? 0;
      return [
        { label: "Total Events", value: total ?? 0 },
        { label: "Live Now", value: l, status: l > 0 ? "ok" : "warning" },
        { label: "Draft", value: draft ?? 0 },
      ];
    },
  },
  {
    id: "professionals",
    title: "Professionals",
    href: "/admin/professionals",
    icon: "🎯",
    fetchStats: async (supabase) => {
      const { count: total } = await supabase.from("professionals").select("id", { count: "exact", head: true });
      const { count: pending } = await supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "pending");
      const { count: approved } = await supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "approved");
      const { count: suspended } = await supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "suspended");
      const p = pending ?? 0;
      return [
        { label: "Total", value: total ?? 0 },
        { label: "Pending Review", value: p, status: p > 0 ? "alert" : "ok" },
        { label: "Approved", value: approved ?? 0, status: "ok" },
        { label: "Suspended", value: suspended ?? 0, status: (suspended ?? 0) > 0 ? "warning" : "ok" },
      ];
    },
  },
  {
    id: "withdrawals",
    title: "Withdrawals",
    href: "/admin/withdrawals",
    icon: "💸",
    fetchStats: async (supabase) => {
      const { count: pending } = await supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending");
      const { data: paidRows } = await supabase.from("withdrawals").select("amount").eq("status", "approved");
      const totalPaid = (paidRows ?? []).reduce((sum: number, r: { amount: number }) => sum + (Number(r.amount) || 0), 0);
      const p = pending ?? 0;
      return [
        { label: "Pending Requests", value: p, status: p > 0 ? "alert" : "ok" },
        { label: "Total Paid Out", value: `₦${totalPaid.toLocaleString()}` },
      ];
    },
  },
  {
    id: "coupons",
    title: "Coupons",
    href: "/admin/coupons",
    icon: "🏷️",
    fetchStats: async (supabase) => {
      const { count: total } = await supabase.from("coupons").select("id", { count: "exact", head: true });
      const now = new Date().toISOString();
      const { count: active } = await supabase
        .from("coupons")
        .select("id", { count: "exact", head: true })
        .lte("valid_from", now)
        .or(`valid_until.is.null,valid_until.gte.${now}`);
      const { count: global } = await supabase.from("coupons").select("id", { count: "exact", head: true }).is("event_id", null);
      return [
        { label: "Total", value: total ?? 0 },
        { label: "Active", value: active ?? 0 },
        { label: "Global", value: global ?? 0 },
      ];
    },
  },
  {
    id: "system",
    title: "System Config",
    href: "/admin/system",
    icon: "⚙️",
    superAdminOnly: true,
    fetchStats: async (supabase) => {
      const { data } = await supabase
        .from("system_configurations")
        .select("key, value")
        .in("key", ["platform_markup", "general_configs"]);
      type ConfigValue = { percentage?: number; zero_fee_mode?: boolean; enable_guest_checkout?: boolean; global_announcement?: string };
      const pm = (data?.find((d: { key: string; value: ConfigValue }) => d.key === "platform_markup")?.value ?? {}) as ConfigValue;
      const gc = (data?.find((d: { key: string; value: ConfigValue }) => d.key === "general_configs")?.value ?? {}) as ConfigValue;
      return [
        { label: "Platform Fee", value: `${pm?.percentage ?? 4}%` },
        { label: "Zero-Fee Mode", value: pm?.zero_fee_mode ? "ON ⚠️" : "OFF", status: pm?.zero_fee_mode ? "warning" : "ok" },
        { label: "Guest Checkout", value: gc?.enable_guest_checkout !== false ? "Enabled" : "Disabled" },
      ];
    },
  },
];
