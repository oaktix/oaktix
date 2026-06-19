import { redirect } from "next/navigation";
import { MessageSquare, Mail, Phone, Calendar, DollarSign, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfessionalByUserId, getInquiriesForProfessional } from "@/lib/professionals/queries";

export default async function ProfessionalInquiriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const professional = await getProfessionalByUserId(user.id);
  if (!professional) redirect("/professional");

  const inquiries = await getInquiriesForProfessional(user.id);

  const statusColors: Record<string, string> = {
    new: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    read: "bg-zinc-100 text-zinc-600 border-zinc-200",
    contacted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    quoted: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    booked: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    closed: "bg-zinc-100 text-zinc-400 border-zinc-200",
    spam: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-zinc-900 dark:text-white">Inquiries</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {inquiries.length} total inquiry{inquiries.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-bold text-zinc-900 dark:text-white mb-2">No inquiries yet</h3>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            Once your profile is live and approved, inquiries from event organisers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="glass-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-zinc-900 dark:text-white">{inq.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColors[inq.status]}`}>
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inq.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex gap-2">
                  {inq.phone && (
                    <a href={`tel:${inq.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  )}
                  <a href={`mailto:${inq.email}?subject=Re: Event Inquiry from OakTix`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all">
                    <Mail className="w-3 h-3" /> Reply
                  </a>
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {inq.event_type && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Event Type</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{inq.event_type}</p>
                  </div>
                )}
                {inq.event_date && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Date</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {new Date(inq.event_date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
                {inq.budget && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" /> Budget</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">₦{inq.budget.toLocaleString()}</p>
                  </div>
                )}
                {inq.event_location && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Location</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 line-clamp-1">{inq.event_location}</p>
                  </div>
                )}
              </div>

              {inq.message && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Message</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{inq.message}</p>
                </div>
              )}

              {/* Contact info */}
              <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[#E8EBE7] dark:border-white/5 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {inq.email}</span>
                {inq.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {inq.phone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
