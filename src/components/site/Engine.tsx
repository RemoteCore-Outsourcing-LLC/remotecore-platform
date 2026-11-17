"use client";
import Script from "next/script";

declare global {
  interface Window { ScrollCraft?: { mount: (root: Element) => unknown }; __scMounted?: boolean }
}

// Loads the scroll engine once and mounts it on the page.
export function Engine() {
  return (
    <Script
      src="/scrollcraft.js"
      strategy="afterInteractive"
      onReady={() => {
        if (window.ScrollCraft && !window.__scMounted) {
          window.__scMounted = true;
          window.ScrollCraft.mount(document.body);
        }
      }}
    />
  );
}
