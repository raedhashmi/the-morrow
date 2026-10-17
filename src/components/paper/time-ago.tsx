"use client";
import { useSyncExternalStore } from "react";
import { timeAgo } from "@/lib/utils";

const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};

/** Relative time rendered only on the client, so server and client HTML always match. */
export function TimeAgo({ iso }: { iso: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => timeAgo(new Date(iso)),
    () => "",
  );
  return label ? <> · {label}</> : null;
}
