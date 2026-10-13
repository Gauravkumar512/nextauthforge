import type { Metadata } from "next";
import { LegalPage } from "../../components/auth/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

// EDIT: replace this page with your own Privacy Policy.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" file="app/privacy/page.tsx">
      <p>Your privacy policy goes here.</p>
    </LegalPage>
  );
}
