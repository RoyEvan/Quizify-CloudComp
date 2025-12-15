import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Plus_Jakarta_Sans } from 'next/font/google'

const PJSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Quizify",
  description: "Simply Quiz, Quizify",
  icons: {
    icon: [
      {
        url: '/logo.svg',
        href: '/logo.svg',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (<>
    <html lang="en">
      <body className={`${PJSans.className} dark antialiased justify-center`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  </>);
}
