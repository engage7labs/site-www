"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  trackOnboardingCompleted,
  trackOnboardingStarted,
} from "@/lib/telemetry";
import { Check, Heart, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Stage = "loading" | "error" | "profile" | "guidance";
type ProfileType = "entrepreneur" | "amateur_athlete" | "student" | "general";

const COPY = {
  en: {
    profileTitle: "What best describes you?",
    profileSubtitle: "This helps Engage7 understand your context.",
    profiles: {
      entrepreneur: "Entrepreneur",
      amateur_athlete: "Athlete",
      student: "Student",
      general: "Other",
    },
    note: "This does not affect health calculations or medical interpretation.",
    continue: "Continue",
    guideTitle: "Import your Apple Health history",
    guideSubtitle: "Apple Health creates a ZIP that you can choose to upload to Engage7.",
    steps: [
      "Open the Health app on your iPhone.",
      "Open your profile.",
      "Choose Export All Health Data.",
      "Return to Engage7 and upload the Apple Health export ZIP.",
    ],
    privacy: "Your data stays private and user-owned. Engage7 processes only the export you choose to upload and does not replace Apple Health.",
    upload: "Continue to authenticated upload",
    loadError: "We couldn't check your onboarding status. Nothing has been changed.",
    saveError: "We couldn't save your onboarding. Please try again.",
    retry: "Try again",
  },
  pt: {
    profileTitle: "Qual perfil melhor descreve você?",
    profileSubtitle: "Isso ajuda o Engage7 a entender seu contexto.",
    profiles: {
      entrepreneur: "Empreendedor",
      amateur_athlete: "Atleta",
      student: "Estudante",
      general: "Outro",
    },
    note: "Isso não afeta os cálculos de saúde nem a interpretação médica.",
    continue: "Continuar",
    guideTitle: "Importe seu histórico do Apple Health",
    guideSubtitle: "O Apple Health cria um ZIP que você pode escolher enviar ao Engage7.",
    steps: [
      "Abra o app Saúde no seu iPhone.",
      "Abra o seu perfil.",
      "Escolha Exportar Todos os Dados de Saúde.",
      "Volte ao Engage7 e envie o ZIP exportado pelo Apple Health.",
    ],
    privacy: "Seus dados permanecem privados e vinculados à sua conta. O Engage7 processa apenas a exportação que você escolher enviar e não substitui o Apple Health.",
    upload: "Continuar para o envio autenticado",
    loadError: "Não foi possível verificar seu onboarding. Nada foi alterado.",
    saveError: "Não foi possível salvar seu onboarding. Tente novamente.",
    retry: "Tentar novamente",
  },
} as const;

export function OnboardingFlow() {
  const { locale } = useLocale();
  const router = useRouter();
  const copy = locale === "pt-BR" ? COPY.pt : COPY.en;
  const [stage, setStage] = useState<Stage>("loading");
  const [selected, setSelected] = useState<ProfileType | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setStage("loading");
    setMessage("");
    const response = await fetch("/api/auth/onboarding", { cache: "no-store" }).catch(() => null);
    if (!response) {
      setStage("error");
      return;
    }
    if (response.status === 401) {
      router.replace("/login?next=/onboarding");
      return;
    }
    if (!response.ok) {
      setStage("error");
      return;
    }
    const data = (await response.json()) as { completed?: boolean };
    if (data.completed === true) {
      router.replace("/portal");
      return;
    }
    trackOnboardingStarted();
    setStage("profile");
  }, [router]);

  useEffect(() => {
    // The async loader owns the initial remote state transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function saveProfile() {
    if (!selected || saving) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/proxy/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_profile_type: selected }),
    }).catch(() => null);
    if (!response?.ok) {
      setMessage(copy.saveError);
      setSaving(false);
      return;
    }
    setStage("guidance");
    setSaving(false);
  }

  async function complete() {
    if (saving) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/auth/onboarding", { method: "PATCH" }).catch(() => null);
    if (!response?.ok) {
      setMessage(copy.saveError);
      setSaving(false);
      return;
    }
    trackOnboardingCompleted();
    router.push("/portal/upload");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-xl space-y-8 rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-10">
        <div className="flex justify-center"><Logo size={52} compact href="/" /></div>

        {stage === "loading" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />}

        {stage === "error" && (
          <div className="space-y-5 text-center">
            <p className="text-muted-foreground">{copy.loadError}</p>
            <Button onClick={() => void load()}>{copy.retry}</Button>
          </div>
        )}

        {stage === "profile" && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <UserRound className="mx-auto h-8 w-8 text-accent" />
              <h1 className="text-3xl font-semibold">{copy.profileTitle}</h1>
              <p className="text-muted-foreground">{copy.profileSubtitle}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(copy.profiles) as ProfileType[]).map((profile) => (
                <button key={profile} type="button" onClick={() => setSelected(profile)} className={`flex min-h-14 items-center justify-between rounded-xl border px-4 py-3 text-left font-medium transition ${selected === profile ? "border-accent bg-accent/10" : "border-border hover:border-accent/60"}`}>
                  {copy.profiles[profile]}
                  {selected === profile && <Check className="h-5 w-5 text-accent" />}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{copy.note}</p>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button className="w-full" disabled={!selected || saving} onClick={() => void saveProfile()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}{copy.continue}
            </Button>
          </div>
        )}

        {stage === "guidance" && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <Heart className="mx-auto h-8 w-8 text-accent" />
              <h1 className="text-3xl font-semibold">{copy.guideTitle}</h1>
              <p className="text-muted-foreground">{copy.guideSubtitle}</p>
            </div>
            <ol className="space-y-4">
              {copy.steps.map((step, index) => (
                <li key={step} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{index + 1}</span><span>{step}</span></li>
              ))}
            </ol>
            <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 shrink-0 text-accent" /><p>{copy.privacy}</p></div>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button className="w-full" disabled={saving} onClick={() => void complete()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}{copy.upload}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
