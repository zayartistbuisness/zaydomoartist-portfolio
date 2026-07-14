import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const MossAlgorithm = lazy(() => import('./pages/MossAlgorithm.jsx'))

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
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
