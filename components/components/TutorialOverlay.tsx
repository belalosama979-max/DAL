"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { isAdmin, isLeader } from "@/lib/roleUtils";
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
}

const adminSteps: TutorialStep[] = [
  {
    icon: "👋",
    title: "مرحباً بك في مبادرة دال!",
    description: "أنت تملك صلاحيات رئيس النادي. ستساعدك هذه الجولة على فهم كيف تستخدم النظام بكفاءة.",
  },
  {
    icon: "👥",
    title: "إدارة الأعضاء",
    description: "من قائمة «إدارة الأعضاء» يمكنك إضافة أعضاء جدد، وتعيين أدوارهم (عضو، مسؤول فريق، نائب...) وتعيينهم في الفرق.",
  },
  {
    icon: "🏆",
    title: "إدارة الفرق",
    description: "من قائمة «الفرق» يمكنك إنشاء فرق جديدة، تعديل بياناتها، وإدارة نقاطها وخصوماتها مع إمكانية ذكر السبب.",
  },
  {
    icon: "⚖️",
    title: "إدارة المعايير",
    description: "من «إدارة المعايير» أضف معايير التقييم للأعضاء والقادة. هذه المعايير هي أساس التقييم العادل.",
  },
  {
    icon: "🎯",
    title: "التقييمات والمهام",
    description: "من «التقييمات والمهام» يمكنك تقييم جميع الأعضاء والقادة، إضافة وخصم النقاط، وتصفير الرصيد عند الحاجة.",
  },
  {
    icon: "📢",
    title: "الإعلانات",
    description: "من «الإعلانات» أرسل إشعارات وتنبيهات لجميع أعضاء المبادرة، مع تحديد المهل الزمنية.",
  },
];

const leaderSteps: TutorialStep[] = [
  {
    icon: "👋",
    title: "مرحباً أيها القائد!",
    description: "أنت مسؤول فريق في مبادرة دال. ستساعدك هذه الجولة على إدارة فريقك بأفضل طريقة.",
  },
  {
    icon: "🏅",
    title: "لوحة شرف القادة",
    description: "شاهد ترتيبك ونقاطك بين جميع قادة المبادرة. نافس وكن في المقدمة!",
  },
  {
    icon: "👥",
    title: "فريقي",
    description: "من «فريقي» شاهد أعضاء فريقك مرتبين حسب النقاط، وتابع سجل الخصومات الصادرة على الفريق.",
  },
  {
    icon: "⚖️",
    title: "إدارة المعايير",
    description: "راجع معايير التقييم المعتمدة في المبادرة لتكون على دراية كاملة عند تقييم أعضاء فريقك.",
  },
  {
    icon: "🎯",
    title: "التقييمات والمهام",
    description: "من «التقييمات والمهام» قيّم أعضاء فريقك، أضف أو اخصم نقاطهم، وكلّفهم بمهام محددة مع موعد نهائي.",
  },
];

const memberSteps: TutorialStep[] = [
  {
    icon: "👋",
    title: "مرحباً بك في مبادرة دال!",
    description: "هذه لوحتك الشخصية. ستوضح لك هذه الجولة ما يمكنك رؤيته ومتابعته.",
  },
  {
    icon: "⭐",
    title: "نقاطك الحالية",
    description: "في الصفحة الرئيسية ترى رصيدك من النقاط المتراكمة من التقييمات والمهام المنجزة.",
  },
  {
    icon: "🏆",
    title: "لوحة الشرف",
    description: "شاهد ترتيبك داخل فريقك. نافس زملاءك واحرص على تصدر القائمة!",
  },
  {
    icon: "👥",
    title: "فريقي",
    description: "من «فريقي» شاهد جميع أعضاء فريقك وترتيبهم، كما ستجد هنا سجل أي خصومات صادرة على الفريق.",
  },
  {
    icon: "✅",
    title: "المهام والأنشطة",
    description: "من «المهام والأنشطة» شاهد المهام المكلف بها، وعلّم عليها عند إتمامها لتحصل على نقاطها.",
  },
];

export function TutorialOverlay() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const key = `tutorial_done_${user.id}`;
    if (!localStorage.getItem(key)) {
      setIsVisible(true);
    }
  }, [user]);

  if (!user || !isVisible) return null;

  const steps = isAdmin(user.role) ? adminSteps : isLeader(user.role) ? leaderSteps : memberSteps;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  // إغلاق للجلسة فقط (X)
  const handleSkip = () => {
    setIsVisible(false);
  };

  // إخفاء دائم
  const handleClose = () => {
    localStorage.setItem(`tutorial_done_${user.id}`, "1");
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md animate-[fade-in_0.3s_ease-out]">
      <div className="bg-background border border-secondary rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-primary to-accent" />

        {/* Close button - skip for now */}
        <button
          onClick={handleSkip}
          title="تخطي الجولة الآن"
          className="absolute top-4 left-4 p-1.5 rounded-full text-foreground/40 hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step counter */}
        <div className="flex justify-center pt-5 gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-8 py-8 text-center">
          <div className="text-5xl mb-5">{current.icon}</div>
          <h2 className="text-2xl font-black text-foreground mb-3">{current.title}</h2>
          <p className="text-foreground/70 leading-relaxed text-base">{current.description}</p>
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex items-center justify-between gap-4">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-foreground/50 hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-0"
          >
            <ChevronRight className="w-4 h-4" /> السابق
          </button>

          <span className="text-xs text-foreground/30 font-semibold">
            {step + 1} / {steps.length}
          </span>

          {isLast ? (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-black shadow-md shadow-primary/30 hover:opacity-90 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> ابدأ الآن!
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              التالي <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Dismiss permanently */}
        <div className="px-8 pb-6 text-center border-t border-secondary/30 pt-4">
          <button
            onClick={handleClose}
            className="text-xs text-foreground/30 hover:text-foreground/60 transition-colors underline underline-offset-2"
          >
            عدم العرض مجدداً
          </button>
        </div>
      </div>
    </div>
  );
}
