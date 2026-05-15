import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useListReviews, useCreateReview, getListReviewsQueryKey, getGetProductQueryKey, Review } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface ReviewSectionProps {
  productId: number;
  averageRating: number | null;
  reviewCount: number;
}

export function ReviewSection({ productId, averageRating, reviewCount }: ReviewSectionProps) {
  const { t } = useTranslation();
  const { isCustomer, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [ratingError, setRatingError] = useState(false);

  const { data: reviews = [], isLoading } = useListReviews(productId, {
    query: { enabled: !!productId, queryKey: getListReviewsQueryKey(productId) }
  });

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast({ title: t("reviews.success"), description: t("reviews.success_desc") });
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey(productId) });
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
        setRating(0);
        setComment("");
        setShowForm(false);
      },
      onError: (err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          toast({ title: t("reviews.already_reviewed"), variant: "destructive" });
        } else if (status === 403) {
          toast({ title: t("reviews.no_delivered_order"), variant: "destructive" });
        } else {
          toast({ title: t("reviews.error"), variant: "destructive" });
        }
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setRatingError(true);
      return;
    }
    setRatingError(false);
    createReview.mutate({ id: productId, data: { rating, comment: comment || null } });
  };

  return (
    <div className="mt-10">
      <Separator className="mb-8" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("reviews.title")}</h2>
          {reviewCount > 0 && averageRating != null && (
            <div className="flex items-center gap-2 mt-1.5">
              <StarRating rating={averageRating} size="md" />
              <span className="text-sm font-semibold text-foreground">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                {reviewCount === 1 ? t("reviews.based_on", { count: reviewCount }) : t("reviews.based_on_plural", { count: reviewCount })}
              </span>
            </div>
          )}
        </div>

        {isCustomer && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            {t("reviews.write_review")}
          </Button>
        )}

        {!isAuthenticated && (
          <Link href={`/login?redirect=/products/${productId}`}>
            <Button variant="outline" size="sm">{t("reviews.login_to_review")}</Button>
          </Link>
        )}
      </div>

      {/* Write Review Form */}
      {showForm && isCustomer && (
        <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-5 mb-6 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t("reviews.your_rating")}</p>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRate={(v) => { setRating(v); setRatingError(false); }}
            />
            {ratingError && (
              <p className="text-xs text-destructive mt-1">{t("reviews.rating_required")}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{t("reviews.your_review")}</p>
            <Textarea
              placeholder={t("reviews.review_placeholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setShowForm(false); setRating(0); setComment(""); setRatingError(false); }}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={createReview.isPending}>
              {createReview.isPending ? t("reviews.submitting") : t("reviews.submit")}
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="font-medium">{t("reviews.no_reviews")}</p>
          <p className="text-sm mt-1">{t("reviews.no_reviews_desc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(reviews as Review[]).map((review) => (
            <div key={review.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground leading-tight">{review.userName}</p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {t("reviews.verified")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
