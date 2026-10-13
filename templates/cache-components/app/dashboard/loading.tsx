import { Spinner } from "../../components/auth/Spinner";

// Shown inside the dashboard shell while a dashboard page streams in. With
// `cacheComponents`, every page that reads the session needs a boundary like
// this so navigations stay instant.
export default function DashboardLoading() {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center text-[color:var(--af-muted)]">
      <Spinner className="h-6 w-6" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
