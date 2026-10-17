import { PrintToday } from "@/components/paper/print-today";

export const metadata = { title: "Reprinting" };

export default function ReprintPage() {
  return <PrintToday force />;
}
