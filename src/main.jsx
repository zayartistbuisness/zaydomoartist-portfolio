import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// Lazy so the homepage doesn't download the previous site's bundle.
const MossAlgorithm = lazy(() => import('./pages/MossAlgorithm.jsx'))
const TrackingLab = lazy(() => import('./tracking/lab/Lab.jsx'))
const ChapterLab = lazy(() => import('./tracking/kit/ChapterLab.jsx'))

// The new experience is the homepage; /lab stays as an alias of the same page.
const home = (
  <Suspense fallback={<div style={{ minHeight: '100vh', background: '#e8e4db' }} aria-label="Opening Zay Domo Artist" />}>
    <TrackingLab />
  </Suspense>
)

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={home} />
      <Route path="/lab" element={home} />
      <Route
        path="/lab/chapter/:id"
        element={(
          <Suspense fallback={<div style={{ minHeight: '100vh', background: '#e8e4db' }} aria-label="Opening chapter" />}>
            <ChapterLab />
          </Suspense>
        )}
      />
      {/* The previous site (src/App.jsx) is no longer routed: its copy predates
          the verified bio. It remains in the repo and in git history. */}
      <Route
        path="/moss"
        element={(
          <Suspense fallback={<div className="min-h-screen bg-[#0a1a0e]" aria-label="Opening MOSS" />}>
            <MossAlgorithm />
          </Suspense>
        )}
      />
    </Routes>
  </BrowserRouter>,
)
