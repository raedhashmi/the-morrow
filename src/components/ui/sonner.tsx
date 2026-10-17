"use client";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        style: {
          background: "linear-gradient(145deg, rgb(60 14 30 / 0.85), rgb(29 9 17 / 0.8))",
          backdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgb(255 230 215 / 0.14)",
          color: "#f8efe4",
          borderRadius: "1rem",
        },
      }}
      {...props}
    />
  );
}
