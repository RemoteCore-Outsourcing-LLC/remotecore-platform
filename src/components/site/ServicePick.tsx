"use client";
import { useEffect } from "react";

// Career Services: a click on a service card picks that service in the Request a Session form, then scrolls to it.
export function ServicePick() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-pick-service]");
      if (!card) return;
      e.preventDefault();
      const select = document.querySelector<HTMLSelectElement>('#book select[name="service"]');
      if (select) select.value = card.dataset.pickService ?? "";
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("book")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      select?.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
