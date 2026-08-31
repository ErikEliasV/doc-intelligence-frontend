import { redirect } from "next/navigation";

/**
 * The app has no home screen yet — the three in scope are envio, acompanhamento
 * and revisão. Until a shell with navigation exists, `/` sends people to the
 * one screen that is built rather than leaving the create-next-app placeholder
 * standing in a deliverable.
 */
export default function Home() {
  redirect("/envio");
}
