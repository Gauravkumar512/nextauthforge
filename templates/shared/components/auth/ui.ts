// Shared class strings for the generated UI. They only use Tailwind utilities
// that exist in both v3.4 and v4 plus arbitrary values that read the design
// tokens from styles/authforge.css, so changing a token restyles everything.

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const labelClass =
  "block font-mono text-xs font-bold uppercase tracking-widest text-[color:var(--af-muted)]";

export const inputClass =
  "block w-full rounded-[var(--af-radius)] border border-[color:var(--af-border-strong)] bg-[color:var(--af-surface-2)] px-3.5 py-3 text-sm text-[color:var(--af-text)] placeholder:text-[color:var(--af-placeholder)] focus-visible:border-[color:var(--af-accent)] aria-[invalid=true]:border-[color:var(--af-danger)] disabled:cursor-not-allowed disabled:opacity-60";

const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--af-radius)] text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const buttonSizes = {
  md: "px-4 py-3",
  lg: "px-6 py-3",
  sm: "h-10 px-4",
  icon: "h-10 w-10",
};

const buttonTones = {
  primary: "bg-[color:var(--af-accent)] text-[color:var(--af-accent-fg)] hover:bg-[color:var(--af-accent-hover)]",
  secondary:
    "border border-[color:var(--af-border-strong)] bg-transparent text-[color:var(--af-text)] hover:bg-[color:var(--af-surface-2)]",
  danger:
    "border border-[color:var(--af-danger)] bg-transparent text-[color:var(--af-danger)] hover:bg-[color:var(--af-danger-soft)]",
};

/** Button styles for <button> and <Link>. Pick a size instead of adding padding classes. */
export function buttonClass(
  variant: keyof typeof buttonTones = "primary",
  size: keyof typeof buttonSizes = "md"
): string {
  return `${buttonBase} ${buttonSizes[size]} ${buttonTones[variant]}`;
}

export const primaryButton = buttonClass("primary");
export const secondaryButton = buttonClass("secondary");
export const dangerButton = buttonClass("danger");

export const linkClass =
  "font-medium text-[color:var(--af-accent)] underline hover:text-[color:var(--af-accent-hover)]";

export const mutedText = "text-[color:var(--af-muted)]";

export const cardClass =
  "rounded-[var(--af-radius)] border border-[color:var(--af-border)] bg-[color:var(--af-surface)]";

export const headingFont = "font-mono font-black tracking-tight";
