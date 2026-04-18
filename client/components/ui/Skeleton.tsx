interface Props {
  className?: string
  style?: React.CSSProperties
  width?: string | number
  height?: string | number
  borderRadius?: string | number
}

export default function Skeleton({ className, style, width, height, borderRadius = 8 }: Props) {
  return (
    <div
      className={`shimmer ${className || ''}`}
      style={{ width, height, borderRadius, ...style }}
    />
  )
}
