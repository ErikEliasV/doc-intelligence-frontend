import { redirect } from "next/navigation";

/**
 * The app has no home screen — the three in scope are envio, acompanhamento and
 * revisão, and none of them is a dashboard. `/` sends people to the start of the
 * flow.
 *
 * It stays outside the `(shell)` route group: rendering the sidebar for the
 * duration of a redirect would only flash it. See docs/adr/ADR-0013.md.
 */
export default function Home() {
  redirect("/envio");
}
