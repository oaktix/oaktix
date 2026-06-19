import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import ProfessionalCarousel from "./ProfessionalCarousel";
import type { ProfessionalCategory, Professional } from "@/lib/professionals/types";

interface HomepageProfessionalsSectionProps {
  categoryGroups: { category: ProfessionalCategory; professionals: Professional[] }[];
}

export default function HomepageProfessionalsSection({
  categoryGroups,
}: HomepageProfessionalsSectionProps) {
  if (categoryGroups.length === 0) return null;

  return (
    <div className="w-full mb-24 relative z-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-xs font-bold text-amber-600 uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" /> Event Professionals
            </span>
          </div>
          <h2 className="text-3xl font-bold font-heading text-indigo-500 tracking-tight">
            Discover Event Professionals
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5 max-w-lg">
            Find and hire verified MCs, DJs, Caterers, Photographers, and hundreds more event professionals across Nigeria.
          </p>
        </div>
        <Link
          href="/professionals"
          className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 transition-colors font-bold text-sm mt-4 sm:mt-0 group"
        >
          Browse all professionals <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Category Carousels */}
      <div>
        {categoryGroups.map(({ category, professionals }) => (
          <ProfessionalCarousel
            key={category.id}
            category={category}
            professionals={professionals}
          />
        ))}
      </div>

      {/* CTA Banner */}
      <div className="mt-8 rounded-3xl bg-gradient-to-r from-indigo-500 to-indigo-600 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-white mb-1">
            Are you an event professional?
          </h3>
          <p className="text-indigo-100 text-sm">
            Create your free profile and start receiving bookings from thousands of event organisers.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link
            href="/professionals/register"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-md shadow-amber-500/20 text-center"
          >
            Join as a Professional
          </Link>
          <Link
            href="/professionals"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/20 text-center"
          >
            Browse Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
