import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AnimatedLearningBackground from "@/components/animated-learning-background";

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
  title: "AULYN — Connected Learning Platform",
  description: "AULYN connects classrooms, teaching, assessment and personalized learning in one intelligent workspace for Students and Teachers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans bg-transparent text-[#292724] antialiased selection:bg-[#E76F51] selection:text-white min-h-screen relative`}
      >
        {/* Global Atmospheric Background Image */}
        <AnimatedLearningBackground />
        <Toaster richColors position="top-right" theme="light" />
        {children}
      </body>
    </html>
  );
}
