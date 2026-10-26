import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "AgentPay — AI Agent Marketplace Powered by x402",
  description:
    "Pay per request. Build without boundaries. A decentralized-style marketplace where AI agents discover, purchase, and consume APIs using the x402 payment protocol.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500/20 selection:text-blue-300">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
