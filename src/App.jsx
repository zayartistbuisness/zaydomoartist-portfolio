import { WorldMotionProvider } from './components/world/WorldMotion'
import PortfolioExperience from './PortfolioExperience'

export default function App() {
  return (
    <WorldMotionProvider>
      <PortfolioExperience />
    </WorldMotionProvider>
  )
}
