export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`af-spin inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent ${className ?? ""}`}
    />
  );
}
