'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion'

type CursorState = 'default' | 'hover-cta' | 'image'

export default function CustomCursor() {
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<CursorState>('default')
  const isTouch = useRef(false)

  const mouseX = useMotionValue(-200)
  const mouseY = useMotionValue(-200)

  const springConfig = { damping: 28, stiffness: 300, mass: 0.5 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  // Track cursor state via MotionValue for performant updates
  const cursorStateVal = useMotionValue<CursorState>('default')
  useMotionValueEvent(cursorStateVal, 'change', (v) => setState(v))

  useEffect(() => {
    // Skip entirely on touch devices
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    isTouch.current = false
    document.documentElement.classList.add('cursor-none')

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!visible) setVisible(true)
    }

    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element)?.closest?.('[data-cursor]')
      const type = el?.getAttribute('data-cursor') as CursorState | null
      cursorStateVal.set(type ?? 'default')
    }

    const onOut = () => cursorStateVal.set('default')
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseout', onOut, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)

    return () => {
      document.documentElement.classList.remove('cursor-none')
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
    }
  }, [mouseX, mouseY, cursorStateVal, visible])

  // Don't render on server or touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }

  const SIZE = state === 'image' ? 72 : state === 'hover-cta' ? 52 : 32

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9998] pointer-events-none select-none"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        animate={{
          width: SIZE,
          height: SIZE,
          backgroundColor:
            state === 'hover-cta'
              ? '#1A3D2B'
              : state === 'image'
              ? 'rgba(26,26,26,0.85)'
              : 'transparent',
          borderColor: state === 'default' ? '#1A3D2B' : 'transparent',
          borderWidth: state === 'default' ? 1.5 : 0,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 320, mass: 0.4 }}
        style={{
          borderRadius: '50%',
          borderStyle: 'solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state === 'image' && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 700,
              fontSize: '8px',
              letterSpacing: '0.1em',
              color: '#f5f2ee',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            VIEW →
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  )
}
