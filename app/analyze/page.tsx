import { redirect } from "next/navigation";

export default function RetiredAnalyzePage() {
  redirect("/login?next=/onboarding");
}
