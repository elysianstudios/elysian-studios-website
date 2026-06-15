import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'
import PageTransition from './components/PageTransition'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'

// Lazy-load the non-landing routes so their code (and the heavy admin
// editor) stays out of the initial bundle — faster first paint.
const Archive = lazy(() => import('./pages/Archive'))
const Reader  = lazy(() => import('./pages/Reader'))
const Team    = lazy(() => import('./pages/Team'))
const About   = lazy(() => import('./pages/About'))
const Admin   = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollProgress />
      <ScrollToTop />
      <Nav />
      <main>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/archive" element={<PageTransition><Archive /></PageTransition>} />
              <Route path="/read/:slug" element={<PageTransition><Reader /></PageTransition>} />
              <Route path="/team" element={<PageTransition><Team /></PageTransition>} />
              <Route path="/about" element={<PageTransition><About /></PageTransition>} />
              <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
