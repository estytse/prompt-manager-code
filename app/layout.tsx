// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Or your chosen fonts
import "./globals.css"; // Tailwind base styles
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Update metadata for the site
export const metadata: Metadata = {
  title: "Prompt Manager",
  description: "Organize and manage your AI prompts efficiently.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          // Apply font variables and base background/text colors
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
        >
          <header className="w-full flex justify-end items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {/* children represents the content of the current page */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}