"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/api/auth-client";
import { ApiClientError } from "@/lib/api/client";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/api/client-validation";

export type AuthFormMode = "login" | "sign-up";

export interface AuthFormProps {
  mode: AuthFormMode;
}

type FormValues = LoginInput | SignupInput;

function detectSessionCreated(): boolean {
  if (typeof document === "undefined") return false;
  // Supabase server cookies start with `sb-` (e.g. sb-<project>-auth-token).
  return document.cookie.split(";").some((c) => c.trim().startsWith("sb-"));
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = mode === "login";
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: isLogin
      ? { email: "", password: "" }
      : { email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const successFlag = searchParams?.get("signed_up");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      if (isLogin) {
        await signIn({ email: values.email, password: values.password });
        toast.success("Welcome back");
        const next = searchParams?.get("next");
        router.push(next && next.startsWith("/") ? next : "/dashboard");
        router.refresh();
      } else {
        const signupValues = values as SignupInput;
        await signUp({
          email: signupValues.email,
          password: signupValues.password,
        });
        // Some Supabase setups require email confirmation and don't set a
        // session cookie. Detect that and bounce to /login with a flag.
        const hasSession = detectSessionCreated();
        if (hasSession) {
          toast.success("Account created — taking you to your dashboard.");
          router.push("/dashboard");
          router.refresh();
        } else {
          toast.success("Account created. Please sign in.");
          router.push(
            `/login?signed_up=1&email=${encodeURIComponent(values.email)}`
          );
        }
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
        const fieldErrors = err.fieldErrors;
        if (fieldErrors) {
          for (const [field, msgs] of Object.entries(fieldErrors)) {
            if (msgs?.[0]) {
              form.setError(field as keyof FormValues, {
                type: "server",
                message: msgs[0],
              });
            }
          }
        }
      } else {
        setServerError(
          err instanceof Error ? err.message : "Authentication failed."
        );
      }
    }
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground">
          {isLogin ? "Welcome back to Sleepbook" : "Create your Sleepbook"}
        </h1>
        <p className="text-sm text-foreground-muted leading-relaxed">
          {isLogin
            ? "Sign in to log a new night and review your weekly metrics."
            : "Start a 7-day diary in 30 seconds. Free for as long as you need it."}
        </p>
      </div>

      {isLogin && successFlag ? (
        <Alert tone="success">
          <AlertTitle>Account created</AlertTitle>
          <AlertDescription>
            Sign in below to start your first 7-day diary.
          </AlertDescription>
        </Alert>
      ) : null}

      {serverError ? (
        <Alert tone="error">
          <AlertTitle>{isLogin ? "Sign-in failed" : "Sign-up failed"}</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <Field
          label="Email"
          htmlFor="email"
          error={form.formState.errors.email?.message}
        >
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-subtle"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@school.edu"
              invalid={!!form.formState.errors.email}
              {...form.register("email")}
              className="pl-9"
            />
          </div>
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint={
            isLogin ? null : <span>8+ characters recommended</span>
          }
        >
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-subtle"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              invalid={!!form.formState.errors.password}
              {...form.register("password")}
              className="pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-foreground-subtle hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>

        {!isLogin ? (
          <Field
            label="Confirm password"
            htmlFor="confirmPassword"
            error={
              (form.formState.errors as Record<string, { message?: string }>)[
                "confirmPassword"
              ]?.message
            }
          >
            <div className="relative">
              <Lock
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-subtle"
              />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                invalid={
                  !!(form.formState.errors as Record<string, unknown>)[
                    "confirmPassword"
                  ]
                }
                {...form.register("confirmPassword" as keyof FormValues)}
                className="pl-9"
              />
            </div>
          </Field>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          width="full"
          isLoading={form.formState.isSubmitting}
        >
          {isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link
          href={isLogin ? "/sign-up" : "/login"}
          className="text-link hover:underline underline-offset-4"
        >
          {isLogin
            ? "New to Sleepbook? Create an account"
            : "Already have an account? Sign in"}
        </Link>
      </div>

      <p className="rounded-card border border-border bg-surface-muted p-3 text-xs text-foreground-muted leading-relaxed">
        <span className="font-semibold text-foreground">PWA tip · </span>
        After signing in, install Sleepbook to your phone’s home screen for an
        app-like experience and faster morning logging.
      </p>
    </div>
  );
}
