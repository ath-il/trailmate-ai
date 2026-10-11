import { useCallback, useEffect, useState } from "react";

// `beforeinstallprompt` is not in the standard TypeScript DOM lib.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return mql || iosStandalone;
}

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as Macintosh but still has touch.
  const iPadOS = /Macintosh/.test(ua) && "ontouchend" in document;
  return iOS || iPadOS;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

/**
 * Exposes the browser's install flow for the PWA. When the browser offers a
 * native prompt we surface a button; otherwise callers can show the manual
 * "Add to Home Screen" instructions (iOS Safari never fires the event).
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [isIOS] = useState<boolean>(() => isIOSDevice());

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferred) return "unavailable";
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  return {
    canInstall: Boolean(deferred),
    installed,
    isIOS,
    promptInstall,
  };
}
