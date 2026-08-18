import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-[0_0_0_1px_rgba(124,92,255,0.4)]',
  secondary: 'bg-surface border border-border text-text hover:border-border-hover hover:bg-surface-hover',
  ghost: 'text-text-muted hover:text-text hover:bg-surface-hover',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
