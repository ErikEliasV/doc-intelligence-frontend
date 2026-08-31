import type { Metadata } from "next";
import { ReviewScreen } from "@/features/revisao/ReviewScreen";

export const metadata: Metadata = {
  title: "Revisão · DOC Intelligence",
};

export default async function RevisaoPage({ params }: PageProps<"/revisao/[id]">) {
  const { id } = await params;

  return <ReviewScreen id={id} />;
}
