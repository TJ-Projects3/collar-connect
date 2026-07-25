import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 60_000;
const BUILD_ID = (import.meta as any).env?.VITE_BUILD_ID as string | undefined;

async function fetchRemoteBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.buildId === "string" ? data.buildId : null;
  } catch {
    return null;
  }
}

/**
 * Polls /version.json and prompts the user to reload when a newer build is live.
 * No service worker involved — Vite's hashed asset URLs do the rest on reload.
 */
export const UpdateAvailableBanner = () => {
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const localBuildId = useRef<string | null>(BUILD_ID ?? null);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    let cancelled = false;

    const check = async () => {
      const remote = await fetchRemoteBuildId();
      if (cancelled || !remote) return;
      if (!localBuildId.current) {
        localBuildId.current = remote;
        return;
      }
      if (remote !== localBuildId.current) setUpdateReady(true);
    };

    check();
    const interval = window.setInterval(check, POLL_INTERVAL_MS);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  if (!updateReady || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
        <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm text-foreground">
          A new version of NextGen Collar is available.
        </p>
        <Button size="sm" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <button
          type="button"
          aria-label="Dismiss update notice"
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default UpdateAvailableBanner;
