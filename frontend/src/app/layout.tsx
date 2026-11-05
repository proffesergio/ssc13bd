import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = {
  title: "SSC13BD · Same batch. Stronger together.",
  description:
    "The home for Bangladesh’s SSC batch of 2013. Find your people, help a batchmate, and make new memories.",
  applicationName: "SSC13BD",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
