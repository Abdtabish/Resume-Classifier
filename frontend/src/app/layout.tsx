import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Field Classifier",
  description:
    "Upload one PDF or a batch folder of resumes and predict the most likely job field.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

