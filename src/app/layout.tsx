import { AppLanguageProvider } from "@/components/shared/AppLanguageProvider";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { APP_LANGUAGE_COOKIE_KEY } from "@/lib/i18n";
import { OG_ALT, OG_SIZE } from "@/lib/og-share-card";
import { getMetadataBaseUrl } from "@/lib/site-url";
import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import { cookies } from "next/headers";
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

const site = getMetadataBaseUrl();
const defaultTitle = "Nibbo — ваш цифровий дім";
const defaultDescription =
  "Завдання, календар родини, бюджет, нотатки, меню й список покупок — усе в одному затишному сервісі для всієї родини.";

export const metadata: Metadata = {
  metadataBase: site,
  applicationName: "Nibbo",
  title: {
    default: defaultTitle,
    template: "%s · Nibbo",
  },
  description: defaultDescription,
  keywords: [
    "Nibbo",
    "родина",
    "задачі",
    "календар",
    "бюджет",
    "CRM",
    "домашня організація",
  ],
  authors: [{ name: "Nibbo" }],
  creator: "Nibbo",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    alternateLocale: ["en_US"],
    url: site.href,
    siteName: "Nibbo",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/opengraph-image",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        alt: OG_ALT,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(APP_LANGUAGE_COOKIE_KEY)?.value;
  const language = cookieLanguage === "en" ? "en" : "uk";

  return (
    <html lang={language} className={`${inter.variable} ${nunito.variable}`}>
      <body className="font-sans min-h-screen antialiased bg-gradient-to-br from-cream-50 via-rose-50/30 to-lavender-50/20">
        <AppLanguageProvider initialLanguage={language}>
          {children}
          <CookieConsent />
        </AppLanguageProvider>
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
