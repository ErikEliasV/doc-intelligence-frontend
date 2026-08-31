import type { Metadata } from "next";
import Link from "next/link";
import { Card, Icon } from "@/components";

export const metadata: Metadata = {
  title: "Revisão · DOC Intelligence",
};

/**
 * Placeholder. The review screen is the third and last of the three in scope;
 * this route exists so the tracking panel has somewhere real to send a document
 * in `em_conferencia`, and so the id it hands over is visibly correct.
 */
export default async function RevisaoPage({ params }: PageProps<"/revisao/[id]">) {
  const { id } = await params;

  return (
    <main className="p-gutter flex-1">
      <div className="grid max-w-content gap-6">
        <header className="grid gap-2">
          <span className="type-eyebrow text-eyebrow">Triagem</span>
          <h1 className="type-display-2">Revisão e correção</h1>
        </header>

        <Card raised className="flex items-center gap-4 px-5 py-4">
          <Icon name="eye" size={20} />
          <p className="type-body">
            Tela ainda não construída. Documento <span className="type-mono">{id}</span> aguardando
            conferência.
          </p>
        </Card>

        <p className="type-body">
          <Link href="/acompanhamento">Voltar ao painel</Link>
        </p>
      </div>
    </main>
  );
}
