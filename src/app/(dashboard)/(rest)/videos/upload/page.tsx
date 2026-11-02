import type { Metadata } from "next";

import { UploadForm } from "@/components/upload-form";
import { requireAuth } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "Upload video",
  description: "Upload a new video to the VideoApp library.",
};

export default async function DashboardUploadPage() {
  await requireAuth();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <UploadForm />
    </main>
  );
}