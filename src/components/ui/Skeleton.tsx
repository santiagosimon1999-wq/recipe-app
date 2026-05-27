type SkeletonProps = {
  className?: string
  /** Shorthand for width when using inline style is awkward. */
  width?: string | number
  height?: string | number
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  const style =
    width !== undefined || height !== undefined
      ? {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }
      : undefined

  return (
    <span
      className={`skeleton ${className}`.trim()}
      aria-hidden="true"
      style={style}
    />
  )
}
