"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "inherent-os-theme";
const EVENT = "inherent-os-theme-change";

type Theme = "dark" | "light";

/**
 * The DOM is the source of truth for the theme, not React state.
 *
 * `ThemeScript` stamps `data-theme` on <html> before first paint, so reading it
 * through `useSyncExternalStore` avoids both the dark-flash and the cascading
 * re-render that a `useEffect` + `setState` pair would cause. Subscribing to
 * `storage` also keeps two open tabs in agreement.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** The server cannot know the viewer's choice; dark is the design's home. */
function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private-mode storage failures must not break the toggle.
    }
    window.dispatchEvent(new Event(EVENT));
  }, [theme]);

  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-quiet focusable"
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    </button>
  );
}

/**
 * Applies the stored theme before paint so a light-mode viewer never sees a
 * dark flash on first render.
 */
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
