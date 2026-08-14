import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EduMeet.Ai | Next-Gen AI Learning Platform",
  description: "Hackathon-winning AI Educational Platform for Teachers & Students featuring Code Trace Visualizer, AI Notes Summarizer, and Interactive Analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white min-h-screen`}
      >
        <Toaster richColors position="top-right" theme="dark" />
        {children}
      </body>
    </html>
  );
}
