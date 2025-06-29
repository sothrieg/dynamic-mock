import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Schema API Generator',
  description: 'Upload JSON and schema files to generate REST API endpoints',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}