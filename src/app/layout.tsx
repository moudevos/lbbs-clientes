import type { Metadata } from "next";
import "./globals.css";
import { PwaInstaller } from "@/components/PwaInstaller";

export const metadata: Metadata = {
  title: "LBBS Clientes",
  description: "Tu identidad digital y recompensas de La Bajadita.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
    >
      <body>{children}<PwaInstaller /></body>
    </html>
  );
}
