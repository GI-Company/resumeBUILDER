"use strict";

import SharePageClient from "./SharePageClient";

export const metadata = {
  title: "Shared Resume | MYresume",
  description: "View this professional resume designed on MYresume.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SharePageClient id={id} />;
}
