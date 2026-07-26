import { redirect } from "next/navigation";

export default function RetiredPublicResultPage() {
  redirect("/login?next=/onboarding");
}
