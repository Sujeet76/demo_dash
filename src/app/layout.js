import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryClientProvider from "@/utils/query-client.provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata = {
  title: "Ranthambore regency Booking",
  description: "Book your stay at Ranthambore Regency with ease",
  manifest: "/manifest.json",
  keywords: [
    "hotel booking",
    "Ranthambore hotel",
    "luxury accommodation",
    "resort booking",
    "vacation stay",
    "online reservation",
    "hotel rooms",
  ],
  icons: [
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
    { rel: "icon", url: "/favicon.ico" },
  ],
};

export const viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <ReactQueryClientProvider>
        <div className="w-full">{children}</div>
      </ReactQueryClientProvider>
      </body>
    </html>
  );
}
