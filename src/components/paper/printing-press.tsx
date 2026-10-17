"use client";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo";

const LINES = [
  "Reading the morning wires…",
  "Checking what you care about…",
  "Weighing the stories against your taste…",
  "Setting the front page…",
  "Leaving room for one surprise…",
  "Inking the masthead…",
];

export function PrintingPress({ title = "Printing your paper" }: { title?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center text-center animate-in fade-in-0 zoom-in-95 duration-700">
      <div className="glass-strong sheen relative w-full rounded-[2rem] p-8">
        <LogoMark className="mx-auto size-14 animate-pulse" />
        <div className="masthead mt-5 text-3xl text-cream">{title}</div>
        <div className="rule-double mx-auto my-5 w-2/3" />
        <div className="space-y-2.5">
          {[92, 78, 85, 64].map((w, k) => (
            <div key={k} className="mx-auto h-2 overflow-hidden rounded-full bg-white/8" style={{ width: `${w}%` }}>
              <div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-champagne/70 to-transparent"
                style={{ animation: `press 1.6s ${k * 0.18}s ease-in-out infinite` }}
              />
            </div>
          ))}
        </div>
        <p key={i} className="mt-6 text-sm text-champagne/90 animate-in fade-in-0 slide-in-from-bottom-1">{LINES[i]}</p>
      </div>
      <style>{`@keyframes press{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}`}</style>
    </div>
  );
}
