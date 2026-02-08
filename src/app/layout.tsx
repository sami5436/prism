import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prism Stock Analytics | Technical Analysis Dashboard",
  description: "Real-time stock analysis with technical indicators, charts, and AI-powered insights",
  keywords: ["stock analysis", "technical indicators", "RSI", "MACD", "trading"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased gradient-bg">
        {children}
      </body>
    </html>
  );
}
