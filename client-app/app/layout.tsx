import type { Metadata } from "next";
import { QueryProvider } from "./providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TanStack DB Sample - Todo App",
  description: "A simple todo app demonstrating TanStack DB features",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
