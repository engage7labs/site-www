"use client";

import { LoginFormFields } from "@/components/shared/login-form-fields";
import { Logo } from "@/components/shared/logo";
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
  const isAdmin = searchParams.get("admin") === "1";

  // Show session-expired banner before the form renders
  const [showExpired] = useState(unauth);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          <Logo size={48} href="/" />
        </div>
        <CardTitle className="text-2xl">
          {isAdmin ? "Admin Portal" : "Sign in to Engage7"}
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "Administrative access — restricted to authorised accounts"
            : "Personal insight system — your data stays yours"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showExpired && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Session expired. Please sign in again.
          </p>
        )}
        <LoginFormFields redirectTo={isAdmin ? "/admin" : next} />
      </CardContent>
    </Card>
  );
}
