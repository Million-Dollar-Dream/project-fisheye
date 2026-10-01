import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { LOCALE_TAGS } from "@/lib/i18n/config";
import { messagesFor } from "@/lib/i18n/messages";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "./components/I18nProvider";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: {
      default: t("meta.title"),
      template: "%s · Fisheye",
    },
    description: t("meta.description"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1211" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getI18n();
  return (
    <html
      lang={LOCALE_TAGS[locale]}
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider locale={locale} messages={messagesFor(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
