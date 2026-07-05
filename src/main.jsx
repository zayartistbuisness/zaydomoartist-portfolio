import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MossAlgorithm from './pages/MossAlgorithm.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/moss" element={<MossAlgorithm />} />
    </Routes>
  </BrowserRouter>,
)
