import { useEffect } from "react";

/** SPA replacement for per-route `head` titles. */
export function useTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
