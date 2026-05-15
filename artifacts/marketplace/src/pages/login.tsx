import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Store, UserCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["customer", "seller"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: "customer" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setAuth(data);
        toast({ title: t("auth.login_success") });
        setLocation(data.user.role === "seller" ? "/seller/dashboard" : "/");
      },
      onError: (error: any) => {
        toast({
          title: t("common.error"),
          description: error.message || t("auth.invalid_credentials"),
          variant: "destructive",
        });
      },
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data });
  };

  return (
    <Layout>
      <div className="container flex-1 flex items-center justify-center py-12 md:py-16">
        <div className="w-full max-w-md bg-card border border-border p-7 md:p-8 rounded-2xl shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("auth.welcome_back")}</h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">{t("auth.login_subtitle")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-semibold">{t("auth.i_am_a")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="customer" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors min-h-[80px]">
                            <UserCircle2 className="h-6 w-6" />
                            <span className="text-sm font-medium">{t("auth.customer")}</span>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="seller" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors min-h-[80px]">
                            <Store className="h-6 w-6" />
                            <span className="text-sm font-medium">{t("auth.seller")}</span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-1">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.email")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("auth.email_placeholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.password")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-semibold mt-2" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? t("auth.logging_in") : t("auth.login_btn")}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t("auth.no_account")} </span>
            <Link href="/register" className="text-primary hover:underline font-semibold">
              {t("auth.signup_link")}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
