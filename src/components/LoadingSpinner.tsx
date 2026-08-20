interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  return (
    <span
      className={`inline-block ${sizes[size]} rounded-full animate-spin ${className}`}
      style={{ borderColor: 'rgba(175,135,255,0.2)', borderTopColor: '#8b5cf6' }}
      role="status"
      aria-label="Loading"
    />
  )
}
