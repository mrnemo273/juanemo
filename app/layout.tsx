import type { Metadata } from "next";
import '@fontsource-variable/roboto-flex/full.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import "./globals.css";
import Navigation from "../components/Navigation";

export const metadata: Metadata = {
  title: "Juanemo",
  description: "Creative experiments by Juan-Carlos Morales — built with Claude Code.",
};

const themeScript = `
(function() {
  var saved = localStorage.getItem('juanemo-theme');
  if (saved === 'light') document.documentElement.dataset.theme = 'light';
})();
`;


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="/fonts/roboto-flex-latin-full.woff2"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="/fonts/dm-sans-latin-400-normal.woff2"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Navigation>
          {children}
        </Navigation>
      </body>
    </html>
  );
}
