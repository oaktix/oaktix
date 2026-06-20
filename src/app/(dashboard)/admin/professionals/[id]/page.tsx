import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfessionalById } from "@/lib/professionals/queries";
import AdminProfessionalEditClient from "@/components/admin/AdminProfessionalEditClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProfessionalDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Auth guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role =
    (user.user_metadata?.role as string | undefined) ??
    (await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle().then((r) => r.data?.role));
  if (role !== "admin" && role !== "super_admin") redirect("/dashboard");

  const professional = await getProfessionalById(id);
  if (!professional) notFound();

  // Portfolio count
  const { count: portfolioCount } = await supabase
    .from("professional_portfolio")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", id);

  // Inquiry count
  const { count: inquiryCount } = await supabase
    .from("professional_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", id);

  // Categories for dropdown
  const { data: categories } = await supabase
    .from("professional_categories")
    .select("id, name, icon")
    .order("name");

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/professionals"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Professionals
        </Link>
      </div>

      <AdminProfessionalEditClient
        professional={professional}
        categories={categories ?? []}
        portfolioCount={portfolioCount ?? 0}
        inquiryCount={inquiryCount ?? 0}
      />
    </div>
  );
}
