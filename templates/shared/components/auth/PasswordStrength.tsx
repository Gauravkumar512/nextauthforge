const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

// A quick, non-blocking heuristic (length and variety). The real rules are
// enforced by the server; this just nudges people towards a better password.
function score(password: string): number {
  if (!password) return 0;
  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) points++;
  return password.length < 8 ? 0 : Math.max(1, points);
}

export function PasswordStrength({ password, id }: { password: string; id: string }) {
  if (!password) return null;
  const level = score(password);

  return (
    <div className="mt-2" id={id}>
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={`h-1.5 flex-1 rounded-full ${
              bar <= level ? "bg-[color:var(--af-accent)]" : "bg-[color:var(--af-border)]"
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-[color:var(--af-muted)]" aria-live="polite">
        Password strength: <span className="font-bold text-[color:var(--af-text)]">{LABELS[level]}</span>
      </p>
    </div>
  );
}
