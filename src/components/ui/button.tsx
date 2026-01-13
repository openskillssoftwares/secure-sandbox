import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/25",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cyber: "relative overflow-hidden bg-gradient-to-r from-cyan-500 to-green-500 text-black font-bold shadow-[0_0_20px_hsl(190_100%_50%_/_0.4)] hover:shadow-[0_0_30px_hsl(190_100%_50%_/_0.6),0_0_60px_hsl(142_76%_45%_/_0.4)] hover:-translate-y-0.5",
        "cyber-outline": "border-2 border-cyan-500 text-cyan-400 bg-transparent hover:bg-cyan-500/10 shadow-[0_0_15px_hsl(190_100%_50%_/_0.2)] hover:shadow-[0_0_25px_hsl(190_100%_50%_/_0.4)]",
        "cyber-ghost": "text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300",
        "cyber-danger": "bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold shadow-[0_0_20px_hsl(0_84%_60%_/_0.4)] hover:shadow-[0_0_30px_hsl(0_84%_60%_/_0.6)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
