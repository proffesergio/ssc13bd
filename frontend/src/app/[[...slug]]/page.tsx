import { CommunityApp } from "@/components/community-app";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const route = slug?.join("/") || "home";
  if (
    ![
      "home",
      "directory",
      "sos",
      "events",
      "expenses",
      "verification",
      "admin",
    ].includes(route)
  )
    notFound();
  return <CommunityApp route={route} />;
}
