import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MealShare",
  description: "Group meal planning and ordering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
