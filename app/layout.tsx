import type { Metadata } from "next";
import '@fontsource-variable/roboto-flex/full.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import "./globals.css";

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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
