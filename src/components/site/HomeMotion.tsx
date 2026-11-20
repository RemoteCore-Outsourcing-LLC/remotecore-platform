"use client";
import { useEffect } from "react";

// Home only: waveforms, hero depth (scroll + pointer), and the request card peak.
export function HomeMotion() {
  useEffect(() => {
    const $ = <T extends Element>(s: string) => document.querySelector<T>(s);
    const $$ = <T extends Element>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(s));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stops: (() => void)[] = [];

    $$<HTMLElement>("[data-wave]").forEach((w) => {
      const n = Number(w.dataset.wave);
      w.innerHTML = Array.from({ length: n }, (_, i) =>
        `<i style="--h:${Math.round(28 + 72 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6 + 1)))}"></i>`).join("");
    });

    const scene = $<HTMLElement>("#scene"), hero = $<HTMLElement>("#hero");
    if (scene && hero && !reduce) {
      let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
      const tick = () => {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        scene.style.setProperty("--px", cx.toFixed(4));
        scene.style.setProperty("--py", cy.toFixed(4));
        scene.style.setProperty("--sy", (Math.min(scrollY, hero.offsetHeight) * 0.6).toFixed(1));
        if (scrollY < hero.offsetHeight || Math.abs(tx - cx) > 0.001) requestAnimationFrame(tick); else running = false;
      };
      const kick = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
      const move = (e: PointerEvent) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; kick(); };
      const leave = () => { tx = ty = 0; kick(); };
      addEventListener("scroll", kick, { passive: true });
      if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", leave);
      }
      kick();
      stops.push(() => { removeEventListener("scroll", kick); hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", leave); });
    }

    const act = $<HTMLElement>("#request"), card = $<HTMLElement>("#rq");
    if (act && card) {
      const caps = $$<HTMLElement>(".cap", act);
      const fields = $$<HTMLElement>(".rq__fields div", card);
      const checks = $$<HTMLElement>(".screen div", card);
      const cands = $$<HTMLElement>(".cand", card);
      const state = $<HTMLElement>("#rqState");
      const labels = ["Request received", "Screening", "Shortlist ready", "Selected"];
      const dots = $$<HTMLElement>(".stepdots i", act);
      const num = $<HTMLElement>("#stepNum");
      // Phones show the four steps as a plain list, so the card shows its finished state.
      const small = matchMedia("(max-width: 860px)");
      let last = -1, raf = 0;
      const paint = () => {
        const p = reduce || small.matches ? 1 : parseFloat(act.style.getPropertyValue("--sc-p")) || 0;
        if (Math.abs(p - last) > 0.0005) {
          last = p;
          const ph = p < 0.24 ? 0 : p < 0.48 ? 1 : p < 0.72 ? 2 : 3;
          caps.forEach((c, i) => c.classList.toggle("is-on", i === ph));
          const f = Math.min(1, p / 0.2);
          fields.forEach((el, i) => el.classList.toggle("is-on", ph > 0 || f * fields.length > i + 0.3 || i === 0));
          const s = Math.max(0, Math.min(1, (p - 0.26) / 0.18));
          checks.forEach((el, i) => el.classList.toggle("is-on", ph > 1 || s * checks.length > i + 0.2));
          const c = Math.max(0, Math.min(1, (p - 0.5) / 0.16));
          cands.forEach((el, i) => el.classList.toggle("is-on", ph > 2 || c * cands.length > i + 0.2));
          cands.forEach((el) => el.classList.toggle("is-pick", ph === 3 && el.dataset.pick === "1"));
          if (state) state.textContent = labels[ph];
          dots.forEach((d, i) => d.classList.toggle("is-on", i === ph));
          if (num) num.textContent = `${ph + 1} / 4`;
        }
        raf = requestAnimationFrame(paint);
      };
      raf = requestAnimationFrame(paint);
      stops.push(() => cancelAnimationFrame(raf));
    }
    return () => stops.forEach((f) => f());
  }, []);
  return null;
}
