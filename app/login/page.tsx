"use client";

import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link
          href="/login?admin=1"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Admin access
        </Link>
      </p>
    </div>
  );
}
