import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { LoaderCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "ui-focus ui-motion ui-disabled inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-label border border-transparent disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125rem] [&_svg]:stroke-[1.75]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive: "bg-destructive text-destructive-foreground hover:underline",
        outline:
          "border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline underline-offset-4",
        success: "bg-success-surface text-success border-success",
        incorrect: "bg-error-surface text-destructive border-destructive",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-11 px-3 py-2",
        lg: "min-h-12 px-6 py-2",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> &
  ({ asChild: true; loading?: never } | { asChild?: false; loading?: boolean })

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      {...props}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || props["aria-busy"]}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading !== undefined && size !== "icon" && (
            <span
              aria-hidden="true"
              className="inline-flex size-4 shrink-0 items-center justify-center"
            >
              {loading && (
                <LoaderCircle className="size-4 motion-safe:animate-spin motion-reduce:hidden" />
              )}
              {loading && <span className="hidden motion-reduce:inline">…</span>}
            </span>
          )}
          {children}
          {loading && <span className="sr-only">Loading…</span>}
        </>
      )}
    </Comp>
  )
}

export { Button }
