"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { LoginFormFields } from "@/components/shared/login-form-fields";
import { Logo } from "@/components/shared/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { safeAuthRedirectPath } from "@/lib/auth-redirects";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const next = safeAuthRedirectPath(searchParams.get("next") ?? "/portal");
  const claimJobId = searchParams.get("claim_job_id");
  const unauth = searchParams.get("unauth") === "1";
  const isAdmin = searchParams.get("admin") === "1";

  // Show session-expired banner before the form renders
  const [showExpired] = useState(unauth);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          <Logo size={48} compact href="/" />
        </div>
        <CardTitle className="text-2xl">
          {isAdmin ? "Admin Portal" : t.auth.login.title}
        </CardTitle>
        <p className="text-xs font-medium text-muted-foreground/70 mt-0.5">
          {isAdmin ? "Administrative Access" : t.auth.login.portalLabel}
        </p>
        <CardDescription>
          {isAdmin
            ? "Administrative access — restricted to authorised accounts"
            : t.auth.login.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showExpired && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Session expired. Please sign in again.
          </p>
        )}
        <LoginFormFields
          redirectTo={isAdmin ? "/admin" : next}
          claimJobId={claimJobId}
          enableSocialLogin={!isAdmin}
        />
      </CardContent>
    </Card>
  );
}
