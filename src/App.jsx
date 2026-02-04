import { Routes, Route } from 'react-router-dom'
import PresentationPage from './PresentationPage'
import ContactPage from './ContactPage'
import DashboardPage from './DashboardPage'
import TrainingPage from './TrainingPage'

function App() {
    return (
        <Routes>
            <Route path="/" element={<PresentationPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/account" element={<DashboardPage />} />
            <Route path="/training" element={<TrainingPage />} />
        </Routes>
    )
}

export default App
