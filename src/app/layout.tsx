import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading",
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Home CRM 🏠",
  description: "Затишна домашня CRM система для всієї родини",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${inter.variable} ${nunito.variable}`}>
      <body className="font-sans min-h-screen antialiased bg-gradient-to-br from-cream-50 via-rose-50/30 to-lavender-50/20">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#fff",
              color: "#292524",
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              border: "1px solid #e7e5e4",
              fontFamily: "inherit",
            },
            success: {
              iconTheme: { primary: "#f43f5e", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
