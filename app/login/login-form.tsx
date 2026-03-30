"use client";

import { LoginFormFields } from "@/components/shared/login-form-fields";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/portal";
  const unauth = searchParams.get("unauth") === "1";

  // Show session-expired banner before the form renders
  const [showExpired] = useState(unauth);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground text-lg font-bold">
          E7
        </div>
        <CardTitle className="text-2xl">Sign in to Engage7</CardTitle>
        <CardDescription>
          Personal insight system — your data stays yours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showExpired && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Session expired. Please sign in again.
          </p>
        )}
        <LoginFormFields redirectTo={next} />
      </CardContent>
    </Card>
  );
}
