import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function PageTransition({ children }) {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 8 },
      // clearProps drops the leftover inline transform when done — otherwise it
      // forms a containing block that breaks position:fixed (modals, bars) inside.
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform' }
    )
  }, [])
  return <div ref={ref}>{children}</div>
}
