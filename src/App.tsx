import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import TopNav from '@/components/layout/TopNav'
import Landing from '@/pages/Landing'

const Lexer = lazy(() => import('@/pages/Lexer'))
const FirstFollowLeading = lazy(() => import('@/pages/FirstFollowLeading'))
const ExpressionValidator = lazy(() => import('@/pages/ExpressionValidator'))
const Ll1Parser = lazy(() => import('@/pages/Ll1Parser'))
const NfaToDfa = lazy(() => import('@/pages/NfaToDfa'))

export default function App() {
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <TopNav />
      <main className="flex-1 min-h-0 flex flex-col">
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="p-6 text-sm text-text-muted">Loading…</div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Landing />} />
              <Route path="/lexer" element={<Lexer />} />
              <Route path="/pattern-matcher" element={<ExpressionValidator defaultTab="pattern" />} />
              <Route path="/expression-validator" element={<ExpressionValidator defaultTab="expression" />} />
              <Route path="/first-follow-leading" element={<FirstFollowLeading />} />
              <Route path="/ll1-parser" element={<Ll1Parser />} />
              <Route path="/nfa-to-dfa" element={<NfaToDfa />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
    </div>
  )
}
