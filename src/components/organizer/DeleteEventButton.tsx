"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteEventButtonProps {
  eventId: string;
}

export default function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you absolutely sure you want to permanently delete this event? This action is irreversible and will delete all associated tickets.")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/organizer/events/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete event");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all text-sm font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50"
      title="Delete Event"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete
    </button>
  );
}
