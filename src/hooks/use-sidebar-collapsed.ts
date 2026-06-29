"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "pos-sidebar-collapsed";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

// Sidebar minimize/expand dipersist ke localStorage tanpa effect — useSyncExternalStore
// adalah primitive React yang tepat untuk membaca state dari luar React (di sini:
// localStorage) dan tetap aman terhadap hydration mismatch SSR/client.
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function setCollapsed(value: boolean) {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    listeners.forEach((listener) => listener());
  }

  return [collapsed, setCollapsed] as const;
}
