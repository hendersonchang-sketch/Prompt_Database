import type { Metadata } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google"; // Added Noto_Sans_TC
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoSansTC = Noto_Sans_TC({
    weight: ['400', '500', '700'],
    subsets: ['latin'],
    variable: '--font-noto-sans-tc',
    display: 'swap',
});

export const metadata: Metadata = {
    title: "Graphic Prompt Database",
    description: "Generate, Store, and Manage AI Prompts",
};

import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} ${notoSansTC.variable}`}>
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </body>
        </html>
    );
}
