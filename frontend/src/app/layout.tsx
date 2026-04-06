import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import UserProfile from "@/components/user profile/userProfile";

const outfitFont = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SolvingHub",
  description: "A platform for discovering and solving real-world problems",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfitFont.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="pt-16">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Analytics />
          </main>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
