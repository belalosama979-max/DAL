"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden transition-colors duration-300">

      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="w-full flex items-center justify-between px-8 py-6 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="شعار المبادرة" className="w-12 h-12 object-contain" />
          <span className="text-2xl font-black text-foreground tracking-tight">مبادرة دال</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "male" ? "female" : "male")}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            title={`تبديل التصميم (الحالي: ${theme === 'male' ? 'طلاب' : 'طالبات'})`}
          >
            <Settings className="w-5 h-5 text-foreground/70" />
          </button>
          <Link
            href="/login"
            className="px-5 py-2 bg-secondary text-secondary-foreground rounded-full font-bold shadow hover:shadow-md hover:bg-secondary/80 transition-all"
          >
            دخول الأعضاء
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 z-10">
        <div className="text-center max-w-2xl mx-auto animate-[slide-up_0.8s_ease-out]">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="مبادرة دال" className="w-28 h-28 object-contain drop-shadow-xl" />
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 leading-tight">
            مبادرة <span className="text-[#1d7261]">دال</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/70 mb-10 leading-relaxed">
            مبادرة طلابية في جامعة الحسين التقنية تهدف إلى تنمية الجانب الإيماني القرآني في نفوس الطلبة وغرس القيم القرآنية من خلال الفرق والأنشطة المتنوعة.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
            >
              بوابة الأعضاء <ArrowLeft className="w-5 h-5" />
            </Link>
            <a
              href="https://www.instagram.com/dal_htu?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-background text-foreground border-2 border-secondary rounded-2xl font-bold shadow hover:bg-secondary/50 transition-all flex items-center justify-center gap-2 text-lg"
            >
              {/* Instagram SVG icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              تابعنا على إنستغرام
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-foreground/30 text-sm z-10">
        © {new Date().getFullYear()} مبادرة دال
      </footer>
    </div>
  );
}
