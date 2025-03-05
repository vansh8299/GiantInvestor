"use client";

import { Inter } from "next/font/google";
import Header from "@/components/header";
import Footer from "@/components//footer"
import { SearchProvider } from "@/context/SearchContext";
import "./globals.css";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

// Define routes where header should be hidden
const authRoutes = [
  "/pages/login",
  "/pages/signup",
  "/pages/verifyotp",
  "/pages/resetPassword",
  "/pages/forgetpassword"
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthPage = authRoutes.includes(pathname);

  return (
    <html lang="en">
      <body className={`${inter.className} dotted-background`}>
        <Providers>
          <SearchProvider>
            {!isAuthPage && <Header />}
            <main className="min-h-screen mb-24">{children}</main>
            {!isAuthPage && <Footer />}
          </SearchProvider>
        </Providers>
        <Toaster richColors />
        <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      </body>
    </html>
  );
}