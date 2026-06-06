import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InboxGuard - SPF DKIM DMARC Monitor",
  description: "Read-only HighLevel SPF, DKIM, DMARC, and sending-domain drift reports.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
