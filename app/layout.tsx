import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "600", "700", "800", "900"],
});

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
  title: "EduMeet.Ai | Intelligent Learning Platform",
  description: "Senior-grade EdTech workspace for Students & Teachers featuring Code Trace Visualizer, AI Notes Summarizer, and Classroom Analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans bg-[#1e1a16] text-[#292724] antialiased selection:bg-[#E76F51] selection:text-white min-h-screen relative`}
      >
        <Toaster richColors position="top-right" theme="light" />
        {children}
      </body>
    </html>
  );
}
