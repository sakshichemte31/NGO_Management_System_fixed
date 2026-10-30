import { lazy, Suspense, type ReactNode } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Layout from "./components/Layout"
import { RoleProvider } from "./context/RoleContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ToastProvider } from "./components/projects/Toast"

const Dashboard = lazy(() => import("./pages/Dashboard"))
const AllProjects = lazy(
  () => import("./pages/projects/management/AllProjects"),
)
const CreateProject = lazy(
  () => import("./pages/projects/management/CreateProject"),
)
const ProjectDetails = lazy(
  () => import("./pages/projects/management/ProjectDetails"),
)
const ProjectReports = lazy(() => import("./pages/projects/management/Reports"))
const ProposalsPage = lazy(() => import("./pages/projects/Proposals"))
const PlanningPage = lazy(() => import("./pages/projects/Planning"))
const EventsPage = lazy(() => import("./pages/events/Events"))
const EventsCalendar = lazy(() => import("./pages/events/EventsCalendar"))
const BeneficiariesPage = lazy(
  () => import("./pages/beneficiaries/Beneficiaries"),
)
const ResourcesPage = lazy(() => import("./pages/resources/Resources"))
const OccasionsPage = lazy(() => import("./pages/occasions/Occasions"))
const EngagementPage = lazy(() => import("./pages/engagement/Engagement"))
const OutcomesPage = lazy(() => import("./pages/outcomes/Outcomes"))
const ReportsPage = lazy(() => import("./pages/reports/Reports"))
const DepartmentReports = lazy(
  () => import("./pages/reports/DepartmentReports"),
)
const CommunicationPage = lazy(
  () => import("./pages/communication/Communication"),
)
const AdminPage = lazy(() => import("./pages/admin/Admin"))
const LoginPage = lazy(() => import("./pages/Login"))
const RegisterPage = lazy(() => import("./pages/Register"))

function AuthLoading() {
  return <div role="status" className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking your session…</div>
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoading />
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  return user?.role === "Admin" ? children : <Navigate to="/dashboard" replace />
}

const birthdayModule = () => import("./pages/birthday-donor/ngoModules")
const BirthdayProjectActionWorkspace = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectActionWorkspace,
  })),
)
const BirthdayProjectDashboard = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectDashboard,
  })),
)
const BirthdayProjectDepartments = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectDepartments,
  })),
)
const BirthdayProjectEngagement = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectEngagement,
  })),
)
const BirthdayProjectOccasions = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectOccasions,
  })),
)
const BirthdayProjectOutcomes = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectOutcomes,
  })),
)
const BirthdayProjectProfiles = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectProfiles,
  })),
)
const BirthdayProjectReports = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.BirthdayProjectReports,
  })),
)
const DonorManagementAdminDashboard = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.DonorManagementAdminDashboard,
  })),
)
const DonorManagementCampaigns = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.DonorManagementCampaigns,
  })),
)
const DonorManagementCommunication = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.DonorManagementCommunication,
  })),
)
const DonorManagementContributions = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.DonorManagementContributions,
  })),
)
const DonorManagementDirectory = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.DonorManagementDirectory,
  })),
)
const DonorManagementFollowUp = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.DonorManagementFollowUp,
  })),
)
const DonorManagementReports = lazy(() =>
  birthdayModule().then((module) => ({
    default: module.DonorManagementReports,
  })),
)
const PeopleIndex = lazy(() => import("./pages/people-management/PeopleIndex"))
const PMHRPage = lazy(() => import("./pages/people-management/HR"))
const PMInternsPage = lazy(() => import("./pages/people-management/Interns"))
const PMVolunteersPage = lazy(
  () => import("./pages/people-management/Volunteers"),
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <ToastProvider>
          <Suspense
            fallback={
              <div
                role="status"
                className="flex min-h-screen items-center justify-center text-sm text-slate-500"
              >
                Loading page…
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="projects" element={<AllProjects />} />
                <Route path="projects/activate" element={<AdminRoute><CreateProject /></AdminRoute>} />
                <Route path="projects/create" element={<Navigate to="/projects/activate" replace />} />
                <Route path="projects/reports" element={<ProjectReports />} />
                <Route path="projects/proposals" element={<ProposalsPage />} />
                <Route path="projects/planning" element={<PlanningPage />} />
                <Route path="projects/:id" element={<ProjectDetails />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/calendar" element={<EventsCalendar />} />
                <Route path="beneficiaries" element={<BeneficiariesPage />} />
                <Route path="resources" element={<ResourcesPage />} />
                <Route path="occasions" element={<OccasionsPage />} />
                <Route path="engagement" element={<EngagementPage />} />
                <Route path="outcomes" element={<OutcomesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route
                  path="reports/department"
                  element={<DepartmentReports />}
                />
                <Route path="communication" element={<CommunicationPage />} />
                <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

                {/* Birthday Project module */}
                <Route
                  path="birthday-project/dashboard"
                  element={<BirthdayProjectDashboard />}
                />
                <Route
                  path="birthday-project/profiles"
                  element={<BirthdayProjectProfiles />}
                />
                <Route
                  path="birthday-project/occasions"
                  element={<BirthdayProjectOccasions />}
                />
                <Route
                  path="birthday-project/engagement"
                  element={<BirthdayProjectEngagement />}
                />
                <Route
                  path="birthday-project/outcomes"
                  element={<BirthdayProjectOutcomes />}
                />
                <Route
                  path="birthday-project/departments"
                  element={<BirthdayProjectDepartments />}
                />
                <Route
                  path="birthday-project/reports"
                  element={<BirthdayProjectReports />}
                />
                <Route
                  path="birthday-project/action-workspace"
                  element={<BirthdayProjectActionWorkspace />}
                />
                {/* Donor Management module */}
                <Route
                  path="donor-management/admin/dashboard"
                  element={<DonorManagementAdminDashboard />}
                />
                <Route
                  path="donor-management/admin/directory"
                  element={<DonorManagementDirectory />}
                />
                <Route
                  path="donor-management/admin/contributions"
                  element={<DonorManagementContributions />}
                />
                <Route
                  path="donor-management/admin/campaigns"
                  element={<DonorManagementCampaigns />}
                />
                <Route
                  path="donor-management/admin/communications"
                  element={<DonorManagementCommunication />}
                />
                <Route
                  path="donor-management/admin/followup"
                  element={<DonorManagementFollowUp />}
                />
                <Route
                  path="donor-management/admin/reports"
                  element={<DonorManagementReports />}
                />
                {/* People Management module */}
                <Route
                  path="people-management"
                  element={
                    <div className="people-module">
                      <PeopleIndex />
                    </div>
                  }
                />
                <Route
                  path="people-management/hr"
                  element={
                    <div className="people-module">
                      <PMHRPage />
                    </div>
                  }
                />
                <Route
                  path="people-management/interns"
                  element={
                    <div className="people-module">
                      <PMInternsPage />
                    </div>
                  }
                />
                <Route
                  path="people-management/volunteers"
                  element={
                    <div className="people-module">
                      <PMVolunteersPage />
                    </div>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </Suspense>
          </ToastProvider>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
