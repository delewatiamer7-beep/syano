import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  customer: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  seller: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  admin: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => adminApi.getUsers(page, PAGE_SIZE),
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast({ title: t("admin.user_deleted") });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6" /> {t("admin.nav_users")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("admin.users_desc")}</p>
          </div>
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            {total} {t("admin.total_count")}
          </div>
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={t("admin.search_users")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_name")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_email")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_role")}</th>
                  <th className="text-start px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_joined")}</th>
                  <th className="text-end px-4 py-3 font-semibold text-muted-foreground">{t("admin.col_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))}
                {!isLoading && filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${ROLE_COLORS[user.role] ?? "bg-muted text-muted-foreground"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        size="icon" variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(user)}
                        disabled={user.role === "admin"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!isLoading && !filtered.length && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">{t("admin.no_results")}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <span className="text-sm text-muted-foreground">
                {t("admin.page_of", { page, totalPages })}
              </span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.delete_user_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.delete_user_desc", { name: deleteTarget?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("seller_products.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {t("seller_products.confirm_delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
