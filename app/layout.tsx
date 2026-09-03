import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Racha — Divide a conta no PIX sem estresse",
  description: "Racha contas entre amigos no PIX sem cadastro e proteja o caixa da república com auditoria on-chain na Solana.",
  openGraph: {
    title: "Racha — Divide a conta no PIX",
    description: "Crie cobranças em 15s, compartilhe no WhatsApp e veja quem pagou no PIX em tempo real.",
    locale: "pt_BR",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Racha",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('racha_theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-16 pt-5">
          {children}
        </div>
      </body>
    </html>
  );
}
