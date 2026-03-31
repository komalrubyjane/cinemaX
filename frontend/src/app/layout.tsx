import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MovieChatbot from "@/components/MovieChatbot";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CinemaX - Premium Streaming",
  description: "Experience cinema like never before with AI-powered recommendations, HD posters, and real-time watch parties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <MovieChatbot />
      </body>
    </html>
  );
}
