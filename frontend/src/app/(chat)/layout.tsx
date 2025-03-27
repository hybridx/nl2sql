import type { Metadata } from "next";
import { Red_Hat_Text } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const redHatText = Red_Hat_Text({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NLtoSQL AI Chatbot",
  description: "NLtoSQL chatbot web interface",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased tracking-tight ${redHatText.className}`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
