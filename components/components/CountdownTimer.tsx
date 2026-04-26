"use client";

import { useState, useEffect } from "react";
import { Timer, Clock, CheckCircle } from "lucide-react";

interface CountdownTimerProps {
  start_time?: string; // إذا فارغ = يبدأ الآن
  deadline?: string;   // إذا فارغ = لا ينتهي
}

type Phase = "upcoming" | "active" | "expired";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(targetMs: number): TimeLeft {
  const diff = Math.max(0, targetMs - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function formatParts(t: TimeLeft): string {
  const parts: string[] = [];
  if (t.days > 0) parts.push(`${t.days}ي`);
  if (t.hours > 0) parts.push(`${t.hours}س`);
  if (t.minutes > 0) parts.push(`${t.minutes}د`);
  parts.push(`${t.seconds}ث`);
  return parts.join(" ");
}

export function CountdownTimer({ start_time, deadline }: CountdownTimerProps) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const startMs = start_time ? new Date(start_time).getTime() : now;
      const endMs = deadline ? new Date(deadline).getTime() : null;

      if (now < startMs) {
        // لم يبدأ بعد
        setPhase("upcoming");
        setTimeLeft(calcTimeLeft(startMs));
      } else if (endMs !== null && now >= endMs) {
        // انتهى
        setPhase("expired");
        setTimeLeft(null);
      } else {
        // نشط
        setPhase("active");
        setTimeLeft(endMs ? calcTimeLeft(endMs) : null);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start_time, deadline]);

  if (phase === null) return null;

  if (phase === "expired") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-500 rounded-md text-[11px] font-bold mt-2 w-fit">
        <CheckCircle className="w-3 h-3" />
        <span>انتهى</span>
      </div>
    );
  }

  if (phase === "upcoming" && timeLeft) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-[11px] font-bold mt-2 w-fit">
        <Clock className="w-3 h-3 animate-pulse" />
        <span>يبدأ خلال: {formatParts(timeLeft)}</span>
      </div>
    );
  }

  // نشط
  if (!deadline) {
    // بدء الآن ولا ينتهي
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-[11px] font-bold mt-2 w-fit">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>نشط</span>
      </div>
    );
  }

  if (timeLeft) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md text-[11px] font-bold mt-2 w-fit">
        <Timer className="w-3 h-3 animate-pulse" />
        <span>ينتهي خلال: {formatParts(timeLeft)}</span>
      </div>
    );
  }

  return null;
}
