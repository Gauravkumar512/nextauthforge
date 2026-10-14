import Link from "next/link";
import type { ReactNode } from "react";
import { Af } from "./Af";
import { BrandLogo } from "./BrandLogo";
import { FormAlert } from "./FormAlert";
import { cx, headingFont, linkClass, mutedText } from "./ui";

/** Shared layout for the placeholder Terms and Privacy pages. */
export function LegalPage({
  title,
  file,
  children,
}: {
  title: string;
  /** Path of the page the developer should edit, shown in the notice. */
  file: string;
  children?: ReactNode;
}) {
  return (
    <Af className="flex flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <BrandLogo />
        <Link href="/" className={cx(linkClass, "text-sm")}>
          Back to home
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6 sm:px-6">
        <h1 className={cx(headingFont, "text-3xl")}>{title}</h1>
        <FormAlert tone="info" title="Placeholder page" className="mt-6">
          This page is a placeholder. Replace it with your own legal text by editing <code className="font-mono">{file}</code>.
          Nothing here is legal advice.
        </FormAlert>
        <div className={cx(mutedText, "mt-6 space-y-4 text-sm leading-relaxed")}>{children}</div>
      </main>
    </Af>
  );
}
