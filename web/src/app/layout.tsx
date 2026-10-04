import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NightGuard AI | Zero-Leak Nocturnal Hypo Guardian",
  description:
    "Prior Labs TabPFN foundation tabular intelligence for nocturnal hypoglycemia forecasting. Built for Liam.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#030712" />
      </head>
      <body>
        <div className="ambient-mesh" />
        {children}
      </body>
    </html>
  );
}
