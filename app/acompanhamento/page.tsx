import type { Metadata } from "next";
import { TrackingScreen } from "@/features/acompanhamento/TrackingScreen";

export const metadata: Metadata = {
  title: "Acompanhamento · DOC Intelligence",
};

export default function AcompanhamentoPage() {
  return (
    <main className="p-gutter flex-1">
      <TrackingScreen />
    </main>
  );
}
