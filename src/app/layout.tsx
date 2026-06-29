import type { Metadata } from "next";
import "./globals.css";

// Ícones servidos pelas convenções de arquivo do App Router
// (favicon.ico, icon.png, apple-icon.png) — o Next adiciona hash de versão
// ao icon.png, o que força o navegador a buscar a versão nova (cache-bust).
export const metadata: Metadata = {
  title: "TupperStore — Painel",
  description: "Painel de vendas TupperStore",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sublime-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
