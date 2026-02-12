import { Routes, Route, Navigate } from 'react-router-dom'
import PresentationPage from './PresentationPage'
import ContactPage from './ContactPage'
import DashboardPage from './DashboardPage'
import HistoryPage from './HistoryPage'
import TrainingPage from './TrainingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import MedicalWatchPage from './MedicalWatchPage'
import CreateTrainingPage from './CreateTrainingPage'
import AdminUsersPage from './AdminUsersPage'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import PrivateRoute from './components/PrivateRoute'
import Chatbot from './components/Chatbot'

function App() {
    return (
        <AuthProvider>
            <ChatProvider>
                <div className="min-h-screen bg-slate-50 relative">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<PresentationPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Protected Routes */}
                        <Route element={<PrivateRoute />}>
                            <Route path="/account" element={<DashboardPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/history" element={<HistoryPage />} />
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

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>

                    {/* Global Chatbot */}
                    <Chatbot />
                </div>
            </ChatProvider>
        </AuthProvider>
    )
}

export default App
