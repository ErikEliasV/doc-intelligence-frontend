import type { Metadata } from "next";
import { ReviewScreen } from "@/features/revisao/ReviewScreen";

export const metadata: Metadata = {
  title: "Revisão · DOC Intelligence",
};

export default async function RevisaoPage({ params }: PageProps<"/revisao/[id]">) {
  const { id } = await params;

  return (
    <main className="p-gutter flex-1">
      <ReviewScreen id={id} />
    </main>
  );
}
