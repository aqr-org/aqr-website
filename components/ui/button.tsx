import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-qlack border-2 border-qlack hover:bg-qlack hover:text-qaupe hover:border-qlack transition-all",
        qreen:
          "bg-transparent text-qreen border-2 border-qreen hover:bg-qreen hover:text-qaupe hover:border-qreen transition-all",
        qaupe:
          "bg-transparent text-qaupe border-2 border-qaupe hover:bg-qaupe hover:text-qaupe hover:border-qaupe transition-all",
        alert:
          "bg-red text-qaupe shadow-sm hover:bg-red/90",
        filled:
          "border border-qlack bg-qlack text-qaupe hover:bg-qreen hover:text-qlack",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 py-4 text-lg",
        sm: "h-10 px-3 text-sm",
        lg: "h-16 px-6 text-xl",
        icon: "h-9 w-9",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
