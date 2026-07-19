import { useRef, type PointerEvent, type PropsWithChildren } from 'react'

type SpotlightSurfaceProps = PropsWithChildren<{
  className?: string
  color?: string
}>

export function SpotlightSurface({
  children,
  className = '',
  color = 'oklch(0.74 0.15 190 / 0.14)',
}: SpotlightSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null)

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    ref.current.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
    ref.current.style.setProperty('--spot-color', color)
  }

  return (
    <div ref={ref} onPointerMove={handlePointerMove} className={`spotlight-surface ${className}`}>
      {children}
    </div>
  )
}
