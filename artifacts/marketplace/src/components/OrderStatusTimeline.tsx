import { type ElementType } from "react";
import { CheckCircle2, Circle, Clock, Package, Truck, Home, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderStatusTimelineProps {
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

const STEPS: { key: OrderStatus; icon: ElementType }[] = [
  { key: "pending", icon: Clock },
  { key: "processing", icon: Package },
  { key: "shipped", icon: Truck },
  { key: "delivered", icon: Home },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

export function OrderStatusTimeline({ status, createdAt, updatedAt }: OrderStatusTimelineProps) {
  const { t } = useTranslation();

  const currentIndex = STATUS_ORDER[status];
  const isCancelled = status === "cancelled";

  const getTimestamp = (stepIndex: number): string | null => {
    if (isCancelled) return null;
    if (stepIndex === 0) return format(new Date(createdAt), "MMM d, yyyy 'at' h:mm a");
    if (stepIndex <= currentIndex) return format(new Date(updatedAt), "MMM d, yyyy 'at' h:mm a");
    return null;
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b bg-muted/30">
        <h3 className="font-semibold text-base">{t("orders.timeline_title")}</h3>
      </div>

      <div className="p-6">
        {isCancelled ? (
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-semibold text-sm">{t("orders.status_cancelled")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(updatedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        ) : (
          <ol className="relative">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isPending = idx > currentIndex;
              const isLast = idx === STEPS.length - 1;
              const timestamp = getTimestamp(idx);
              const Icon = step.icon;

              return (
                <li key={step.key} className={cn("relative flex gap-4", !isLast && "pb-6")}>
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute left-[15px] top-7 bottom-0 w-0.5",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}

                  <div className="shrink-0 relative z-10">
                    {isCompleted ? (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                      </div>
                    ) : isCurrent ? (
                      <div className="h-8 w-8 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full border-2 border-border bg-background flex items-center justify-center">
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <p
                      className={cn(
                        "text-sm font-semibold leading-none",
                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {t(`orders.step_${step.key}`)}
                    </p>
                    {timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
                    )}
                    {isCurrent && !timestamp && (
                      <p className="text-xs text-primary mt-1 font-medium">{t("orders.step_current")}</p>
                    )}
                    {isPending && (
                      <p className="text-xs text-muted-foreground/60 mt-1">{t("orders.step_pending_label")}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
