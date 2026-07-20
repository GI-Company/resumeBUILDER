"use strict";

import SharePageClient from "./SharePageClient";

export const metadata = {
  title: "Shared Resume",
  description: "View this professional resume built with Agent Rez AI — the free AI-powered resume builder with ATS-optimized templates.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SharePageClient id={id} />;
}
