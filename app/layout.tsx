import "./globals.css";

export const metadata = {
  title: "Metronome MVP",
  description: "Métronome précis pour musiciens",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {/* BACKGROUND GLOBAL */}
        <div className="app-background">
          {/* CONTENU AU-DESSUS DU BACKGROUND */}
          <div className="relative z-10 w-full">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
