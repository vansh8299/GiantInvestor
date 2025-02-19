"use client";

import { Inter } from "next/font/google";
import Header from "@/components/header";

import "./globals.css";
import { Toaster } from "sonner";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

// Define routes where header and footer should be hidden
const authRoutes = ['/pages/login', '/pages/signup','/pages/verifyotp','/pages/resetPassword', '/pages/forgetpassword'];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAuthPage = authRoutes.includes(pathname);

  return (
    <html lang="en">
      <body className={`${inter.className} dotted-background`}>
        {!isAuthPage && <Header />}
        <main className="min-h-screen">{children}</main>
        <Toaster richColors />
        {/* {!isAuthPage && (
         <Footer />
        )} */}
      </body>
    </html>
  );
}