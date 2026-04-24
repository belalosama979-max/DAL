import { Activity } from "lucide-react";
import Image from "next/image";

interface TeamLogoProps {
  name: string;
  colorCode: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { box: "w-9 h-9", icon: 16, px: 36 },
  md: { box: "w-12 h-12", icon: 20, px: 48 },
  lg: { box: "w-16 h-16", icon: 26, px: 64 },
};

export function TeamLogo({ name, colorCode, logoUrl, size = "md", className = "" }: TeamLogoProps) {
  const s = sizeMap[size];

  if (logoUrl) {
    const isDataUri = logoUrl.startsWith("data:");
    const isHttpUrl = logoUrl.startsWith("http://") || logoUrl.startsWith("https://");

    if (isDataUri || isHttpUrl) {
      return (
        <div
          className={`${s.box} rounded-xl overflow-hidden shadow-sm shrink-0 border-2 ${className}`}
          style={{ borderColor: colorCode + "55" }}
        >
          {isDataUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`شعار ${name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={logoUrl}
              alt={`شعار ${name}`}
              width={s.px}
              height={s.px}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      );
    }
  }

  // Fallback: مربع ملون مع أيقونة
  return (
    <div
      className={`${s.box} rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${className}`}
      style={{ backgroundColor: colorCode }}
    >
      <Activity size={s.icon} />
    </div>
  );
}
