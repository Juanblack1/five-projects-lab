import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../../utils/cn'

const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-black transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-5 py-3 text-base',
        sm: 'h-8 px-3 text-xs',
      },
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:translate-y-px',
        ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground active:translate-y-px',
        outline:
          'border border-border bg-background/30 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground active:translate-y-px',
        secondary:
          'border border-border bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:translate-y-px',
      },
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ className, size, variant }))} {...props} />
}
