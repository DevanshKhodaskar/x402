import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-lg";
    
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-500 shadow-sm",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60",
      outline: "border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
      ghost: "text-slate-400 hover:text-white hover:bg-slate-800/60",
      danger: "bg-red-600/90 text-white hover:bg-red-500",
      gradient: "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 shadow-md shadow-blue-500/20",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
