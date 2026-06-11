import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Alerta Clima Limón 2",
  description:
    "Alertas, reportes ciudadanos y clima comunitario para Limón 2, Tola, Rivas, Nicaragua.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-NI">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
