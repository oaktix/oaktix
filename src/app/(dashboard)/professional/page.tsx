import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Eye, MessageSquare, Star, TrendingUp, ArrowRight,
  AlertCircle, CheckCircle, Clock, Edit, Plus, ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfessionalByUserId } from "@/lib/professionals/queries";

export default async function ProfessionalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const professional = await getProfessionalByUserId(user.id);

  // No profile yet — prompt to register
  if (!professional) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white mb-2">
          Professional Dashboard
        </h1>
        <p className="text-zinc-500 text-sm mb-8">
          Manage your professional profile and receive bookings.
        </p>

        <div className="glass-card p-8 text-center">
          <span className="text-5xl block mb-4">🎯</span>
          <h2 className="text-xl font-bold font-heading text-zinc-900 dark:text-white mb-3">
            You don&apos;t have a professional profile yet
          </h2>
          <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
            Create your free professional profile to start receiving inquiries and bookings from event organisers across Nigeria.
          </p>
          <Link
            href="/professionals/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" /> Create Professional Profile
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      label: "Under Review",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-600",
      message: "Your profile is being reviewed by our team. Typically takes 1–2 business days.",
    },
    approved: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      label: "Active & Live",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-600",
      message: "Your profile is live and visible to all visitors.",
    },
    rejected: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      label: "Not Approved",
      bg: "bg-red-500/10 border-red-500/20",
      text: "text-red-600",
      message: professional.rejection_reason ?? "Your profile was not approved. Please contact support.",
    },
    suspended: {
      icon: <AlertCircle className="w-5 h-5 text-zinc-500" />,
      label: "Suspended",
      bg: "bg-zinc-500/10 border-zinc-500/20",
      text: "text-zinc-600",
      message: "Your profile has been suspended. Please contact support.",
    },
  };

  const status = statusConfig[professional.status];

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white">
            Welcome, {professional.professional_name} 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {professional.category?.name} · {[professional.city, professional.state].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/professionals/${professional.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Profile
          </Link>
          <Link
            href="/professional/settings"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Profile
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${status.bg}`}>
        {status.icon}
        <div>
          <p className={`font-bold text-sm ${status.text}`}>{status.label}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{status.message}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Eye className="w-5 h-5 text-indigo-500" />, value: professional.profile_views.toLocaleString(), label: "Profile Views", href: undefined },
          { icon: <MessageSquare className="w-5 h-5 text-amber-500" />, value: professional.inquiry_count.toLocaleString(), label: "Inquiries", href: "/professional/inquiries" },
          { icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />, value: professional.total_reviews > 0 ? professional.average_rating.toFixed(1) : "—", label: `${professional.total_reviews} Reviews`, href: undefined },
          { icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, value: professional.total_bookings.toLocaleString(), label: "Bookings", href: undefined },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-5 ${stat.href ? "hover:border-indigo-500/30 cursor-pointer transition-all" : ""}`}>
            {stat.href ? (
              <Link href={stat.href} className="block">
                <StatContent {...stat} />
              </Link>
            ) : (
              <StatContent {...stat} />
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          href="/professional/portfolio"
          icon="🖼️"
          title="Portfolio"
          description="Upload photos and videos to showcase your work"
          badge={professional.status === "approved" ? undefined : "Approved profiles only"}
        />
        <QuickAction
          href="/professional/inquiries"
          icon="📨"
          title="Inquiries"
          description="View and reply to booking inquiries"
          badge={professional.inquiry_count > 0 ? `${professional.inquiry_count} new` : undefined}
          badgeColor="bg-amber-500"
        />
        <QuickAction
          href="/professional/settings"
          icon="⚙️"
          title="Settings"
          description="Update your profile, pricing, and contact info"
        />
      </div>

      {/* Tips for new professionals */}
      {professional.status === "approved" && professional.profile_views < 50 && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">💡 Tips to Get More Inquiries</h3>
          <div className="space-y-3">
            {[
              { done: !!professional.profile_photo, tip: "Add a professional profile photo" },
              { done: !!professional.cover_image, tip: "Upload a cover image to stand out" },
              { done: (professional.portfolio?.length ?? 0) > 0, tip: "Add portfolio work samples" },
              { done: !!professional.whatsapp, tip: "Add your WhatsApp number for quick contact" },
              { done: !!professional.instagram, tip: "Connect your social media" },
              { done: (professional.starting_price ?? 0) > 0, tip: "Set a starting price to attract the right clients" },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${item.done ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300"}`}>
                <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${item.done ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-700"}`}>
                  {item.done ? "✓" : ""}
                </span>
                {item.tip}
              </div>
            ))}
          </div>
          <Link
            href="/professional/settings"
            className="mt-5 flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 font-bold text-sm transition-colors group"
          >
            Complete your profile <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}

function StatContent({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <>
      <div className="mb-3">{icon}</div>
      <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
  badge,
  badgeColor = "bg-zinc-500",
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Link
      href={href}
      className="glass-card p-5 hover:border-indigo-500/30 hover:shadow-md transition-all group block"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white uppercase ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-indigo-500 transition-colors">
        {title}
      </h4>
      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </Link>
  );
}
