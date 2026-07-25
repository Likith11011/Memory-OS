import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import BackendWaker from "@/components/BackendWaker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MemoryOS",
  description: "AI-powered contextual memory retrieval system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <BackendWaker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}