import type { Metadata } from "next";
import { UploadScreen } from "@/features/envio/UploadScreen";

export const metadata: Metadata = {
  title: "Envio de documentos · DOC Intelligence",
};

export default function EnvioPage() {
  return (
    <main className="p-gutter flex-1">
      <UploadScreen />
    </main>
  );
}
