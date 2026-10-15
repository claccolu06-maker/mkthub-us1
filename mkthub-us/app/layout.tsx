import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MktHub US',
    template: '%s · MktHub US',
  },
  description: 'Agenda privada del curso: fechas de exámenes y entregas, apuntes y dudas.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#f4f7fd',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
