import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITSD Task Tracker - Daily Reports",
  description: "Daily Team Operations Report - Azure DevOps Dashboard",
  icons: {
    icon: '/daily-reports/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-azure-bg text-azure-text">
        {children}
      </body>
    </html>
  );
}