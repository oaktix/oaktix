import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import QRScannerClient from "@/components/scanner/QRScannerClient";

interface ScannerPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ScannerPage({ params }: ScannerPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();
  
  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch the event details
  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, organizer_id")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    notFound();
  }

  // 3. Verify user is authorized (Organizer or assigned staff)
  let isAuthorized = event.organizer_id === user.id;

  if (!isAuthorized) {
    const { data: scannerAssignment } = await supabase
      .from("scanners")
      .select("id")
      .eq("event_id", eventId)
      .eq("staff_id", user.id)
      .single();

    if (scannerAssignment) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    redirect("/scan?error=unauthorized");
  }

  return (
    <QRScannerClient 
      eventId={event.id}
      eventTitle={event.title}
    />
  );
}
