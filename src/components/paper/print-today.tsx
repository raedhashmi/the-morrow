"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintingPress } from "./printing-press";

export function PrintToday({ force = false }: { force?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function run() {
    setError(null);
    const res = await fetch("/api/editions", { method: "POST", body: JSON.stringify({ force }) });
    const data = (await res.json()) as { id?: string; error?: string };
    if (data.id) {
      router.replace(`/paper/${data.id}`);
      router.refresh();
    } else setError(data.error ?? "Something went wrong.");
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error)
    return (
      <div className="glass-strong mx-auto mt-16 max-w-md rounded-[2rem] p-8 text-center">
        <div className="masthead text-3xl text-cream">The presses jammed</div>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={run}>
          <RotateCcw /> Try again
        </Button>
      </div>
    );
  return <PrintingPress title={force ? "Reprinting today's paper" : "Printing today's paper"} />;
}
