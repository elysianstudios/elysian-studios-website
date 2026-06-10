import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'
import PageTransition from './components/PageTransition'
import Home from './pages/Home'
import Archive from './pages/Archive'
import Reader from './pages/Reader'
import Team from './pages/Team'
import About from './pages/About'
import Admin from './pages/Admin'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollProgress />
      <ScrollToTop />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/archive" element={<PageTransition><Archive /></PageTransition>} />
          <Route path="/read/:slug" element={<PageTransition><Reader /></PageTransition>} />
          <Route path="/team" element={<PageTransition><Team /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
