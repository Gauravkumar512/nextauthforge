import type { Metadata } from "next";
import { LegalPage } from "../../components/auth/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

// EDIT: replace this page with your own Terms of Service.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" file="app/terms/page.tsx">
      <p>Your terms of service go here.</p>
    </LegalPage>
  );
}
