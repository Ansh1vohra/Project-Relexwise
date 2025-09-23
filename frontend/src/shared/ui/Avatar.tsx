import { HTMLAttributes } from 'react'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string
  size?: number
}

export function Avatar({ name, src, size = 32, className = '', ...props }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const dimension = { width: size, height: size }
  return (
    <div className={`inline-flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold`} style={dimension} {...props}>
      {src ? <img src={src} alt={name} className="rounded-full w-full h-full object-cover" /> : <span className="text-xs">{initials}</span>}
    </div>
  )
}
