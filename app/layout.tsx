import type { Metadata } from "next";
import '@fontsource-variable/roboto-flex';
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

const moodScript = `
(function() {
  var moods = {
    SHARP:   { GRAD: 120,  XTRA: 340, XOPQ: 160, YOPQ: 30,  YTUC: 740, slnt: 0,  opsz: 144 },
    AIRY:    { GRAD: -100, XTRA: 580, XOPQ: 40,  YOPQ: 100, YTUC: 528, slnt: 0,  opsz: 80  },
    HEAVY:   { GRAD: 150,  XTRA: 400, XOPQ: 175, YOPQ: 25,  YTUC: 760, slnt: 0,  opsz: 144 },
    REFINED: { GRAD: 0,    XTRA: 468, XOPQ: 88,  YOPQ: 78,  YTUC: 620, slnt: -1, opsz: 100 },
    PUNCHY:  { GRAD: 100,  XTRA: 460, XOPQ: 130, YOPQ: 50,  YTUC: 760, slnt: 0,  opsz: 120 }
  };
  var keys = Object.keys(moods);
  var mood = moods[keys[Math.floor(Math.random() * keys.length)]];
  var r = document.documentElement;
  var map = {
    '--hero-grad': mood.GRAD, '--hero-xtra': mood.XTRA,
    '--hero-xopq': mood.XOPQ, '--hero-yopq': mood.YOPQ,
    '--hero-ytuc': mood.YTUC, '--hero-slnt': mood.slnt,
    '--hero-opsz': mood.opsz
  };
  for (var k in map) { r.style.setProperty(k, map[k]); }
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
        <script dangerouslySetInnerHTML={{ __html: moodScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
