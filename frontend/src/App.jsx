import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardLayout from './Layouts/DashboardLayout'
import Overview from './pages/dashboardpage/Overview'
import Analytics from './pages/dashboardpage/Analytics'
import Clients from './pages/dashboardpage/Clients'
import Helpdesk from './pages/dashboardpage/Helpdesk'
import History from './pages/dashboardpage/History'
import Models from './pages/dashboardpage/Models'
import Project from './pages/dashboardpage/Project'
import Services from './pages/dashboardpage/Services'
import ProtectedRoute from './components/ui/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="clients" element={<Clients />} />
        <Route path="helpdesk" element={<Helpdesk />} />
        <Route path="history" element={<History />} />
        <Route path="models" element={<Models />} />
        <Route path="projects" element={<Project />} />
        <Route path="services" element={<Services />} />
      </Route>
    </Routes>
  )
}