import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import {
  useAdminGetSettings,
  useAdminUpdateSettings,
  getAdminGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, RefreshCw } from "lucide-react";

export default function AdminSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [exchangeRate, setExchangeRate] = useState("");

  const { data: settings, isLoading } = useAdminGetSettings();

  useEffect(() => {
    if (settings?.exchangeRate) setExchangeRate(String(settings.exchangeRate));
  }, [settings]);

  const updateMutation = useAdminUpdateSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: t("admin.settings_saved") });
        queryClient.invalidateQueries({ queryKey: getAdminGetSettingsQueryKey() });
      },
      onError: (err: Error) =>
        toast({ title: t("common.error"), description: err.message, variant: "destructive" }),
    },
  });

  const usdPreview = 1;
  const sypPreview = usdPreview * parseFloat(exchangeRate || "14500");

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" /> {t("admin.nav_settings")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("admin.settings_desc")}</p>
        </div>

        <div className="max-w-lg space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-1">{t("admin.exchange_rate_title")}</h2>
            <p className="text-sm text-muted-foreground mb-5">{t("admin.exchange_rate_desc")}</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rate">{t("admin.rate_label")}</Label>
                {isLoading ? (
                  <div className="h-10 bg-muted animate-pulse rounded-md" />
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">1 USD =</span>
                      <Input
                        id="rate"
                        type="number"
                        min="1"
                        step="100"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="ps-16"
                        placeholder="14500"
                      />
                    </div>
                    <Button
                      onClick={() => updateMutation.mutate({ data: { exchangeRate: parseFloat(exchangeRate) } })}
                      disabled={updateMutation.isPending || !exchangeRate}
                    >
                      {updateMutation.isPending ? (
                        <><RefreshCw className="h-4 w-4 animate-spin me-2" />{t("admin.saving")}</>
                      ) : t("admin.save_settings")}
                    </Button>
                  </div>
                )}
              </div>

              {exchangeRate && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("admin.rate_preview")}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">{t("admin.rate_usd")}</p>
                      <p className="font-bold text-lg">${usdPreview.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{t("admin.rate_syp")}</p>
                      <p className="font-bold text-lg">{sypPreview.toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-primary font-medium mb-1">{t("admin.settings_note_title")}</p>
            <p className="text-xs text-muted-foreground">{t("admin.settings_note_desc")}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
