// src/components/ui/Loader.tsx
import React from 'react'

interface LoaderProps {
  /** Size of the spinner (default: 'md') */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the loader fills the whole viewport (default: false) */
  fullPage?: boolean
  /** Optional custom color (Tailwind class) */
  color?: string
  /** Additional classes */
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  fullPage = false,
  color = 'border-brand-500',
  className = '',
}) => {
  const spinner = (
    <div
      className={`
        animate-spin rounded-full border-t-transparent
        ${sizeClasses[size]}
        ${color}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default Loader