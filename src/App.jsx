import { Routes, Route } from 'react-router-dom'
import PresentationPage from './PresentationPage'
import ContactPage from './ContactPage'
import DashboardPage from './DashboardPage'
import TrainingPage from './TrainingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import MedicalWatchPage from './MedicalWatchPage'
import CreateTrainingPage from './CreateTrainingPage'
import AdminUsersPage from './AdminUsersPage'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PresentationPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                    <Route path="/account" element={<DashboardPage />} />
                </Route>

                <Route element={<PrivateRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
                    <Route path="/training" element={<TrainingPage />} />
                    <Route path="/medical-watch" element={<MedicalWatchPage />} />
                </Route>

                <Route element={<PrivateRoute allowedRoles={['PROF', 'ADMIN']} />}>
                    <Route path="/create-training" element={<CreateTrainingPage />} />
                </Route>

                <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
            </Routes>
        </AuthProvider>
    )
}

export default App
