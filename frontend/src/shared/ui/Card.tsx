import { HTMLAttributes } from 'react'

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', ...rest } = props
  return <div className={`card ${className}`} {...rest} />
}

export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', ...rest } = props
  return <div className={`card-header ${className}`} {...rest} />
}

export function CardContent(props: HTMLAttributes<HTMLDivElement>) {
  const { className = '', ...rest } = props
  return <div className={className} {...rest} />
}
