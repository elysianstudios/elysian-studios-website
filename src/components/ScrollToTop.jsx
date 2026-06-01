import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash, state } = useLocation()
  useEffect(() => {
    // Don't scroll to top if navigating to a hash section
    if (!hash && !state?.scrollTo) {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash, state])
  return null
}
