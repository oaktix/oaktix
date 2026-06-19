"use client";

import { useState } from "react";
import { Star, ThumbsUp, CheckCircle, AlertCircle } from "lucide-react";
import type { ProfessionalReview } from "@/lib/professionals/types";
import { submitReview } from "@/lib/professionals/actions";

interface ProfessionalReviewsProps {
  professionalId: string;
  professionalName: string;
  reviews: ProfessionalReview[];
  averageRating: number;
  totalReviews: number;
}

export default function ProfessionalReviews({
  professionalId,
  professionalName,
  reviews,
  averageRating,
  totalReviews,
}: ProfessionalReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");

  // Rating breakdown
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    pct: totalReviews > 0 ? (reviews.filter((r) => r.rating === stars).length / totalReviews) * 100 : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewerEmail) {
      setError("Please enter your name and email.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await submitReview(professionalId, {
      rating,
      review: reviewText || undefined,
      reviewer_name: reviewerName,
      reviewer_email: reviewerEmail,
    });

    setLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Failed to submit review.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      {totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 p-6 bg-white dark:bg-zinc-900 border border-[#E8EBE7] dark:border-white/8 rounded-2xl">
          {/* Overall score */}
          <div className="text-center flex-shrink-0">
            <div className="text-5xl font-extrabold text-zinc-900 dark:text-white">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(averageRating)
                      ? "text-amber-500 fill-amber-500"
                      : "text-zinc-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-2">
            {breakdown.map((b) => (
              <div key={b.stars} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-6 text-right">{b.stars}</span>
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 w-6">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write a review */}
      <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5 font-bold text-sm transition-all"
          >
            <Star className="w-4 h-4" />
            Write a Review
          </button>
        ) : submitted ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">Review Submitted!</p>
              <p className="text-xs text-zinc-500">Thank you for reviewing {professionalName}.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 bg-white dark:bg-zinc-900 border border-[#E8EBE7] dark:border-white/8 rounded-2xl space-y-4">
            <h4 className="font-bold text-zinc-900 dark:text-white">Leave a Review</h4>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm border border-red-500/20">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            {/* Star selector */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        s <= (hoverRating || rating)
                          ? "text-amber-500 fill-amber-500"
                          : "text-zinc-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-zinc-500 self-center">
                  {rating === 5 ? "Excellent" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : "Terrible"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Your Name *</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  required
                  placeholder="Full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Email *</label>
                <input
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Review (optional)</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                placeholder={`Share your experience with ${professionalName}...`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8EBE7] dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-3 rounded-xl border border-[#E8EBE7] dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-10">
          <ThumbsUp className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 bg-white dark:bg-zinc-900 border border-[#E8EBE7] dark:border-white/8 rounded-2xl">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {r.reviewer_name ?? "Anonymous"}
                    </span>
                    {r.is_verified && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-2.5 h-2.5" /> Verified Client
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= r.rating ? "text-amber-500 fill-amber-500" : "text-zinc-300"}`}
                    />
                  ))}
                </div>
              </div>
              {r.review && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{r.review}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
