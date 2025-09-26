import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
}

const base = 'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}
const variants: Record<Variant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
  secondary: 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-primary-500',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-800 focus:ring-primary-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'md', isLoading, className = '', children, ...props }, ref) {
  return (
    <button ref={ref} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {isLoading && <span className="loading-spinner mr-2" />}
      {children}
    </button>
  )
})
