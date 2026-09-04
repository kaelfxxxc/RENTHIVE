import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/Toast";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyAccountPage from "./pages/auth/VerifyAccountPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import IdentityVerificationPage from "./pages/auth/IdentityVerificationPage";
import RenterHomePage from "./pages/renter/RenterHomePage";
import SearchPage from "./pages/renter/SearchPage";
import ListingDetailPage from "./pages/renter/ListingDetailPage";
import MyRentalsPage from "./pages/renter/MyRentalsPage";
import RentalRequestPage from "./pages/renter/RentalRequestPage";
import RentalDetailPage from "./pages/renter/RentalDetailPage";
import WriteReviewPage from "./pages/renter/WriteReviewPage";
import LessorDashboardPage from "./pages/lessor/LessorDashboardPage";
import ListingsPage from "./pages/lessor/ListingsPage";
import CreateListingPage from "./pages/lessor/CreateListingPage";
import LessorRequestsPage from "./pages/lessor/LessorRequestsPage";
import LessorRentalsPage from "./pages/lessor/LessorRentalsPage";
import EarningsPage from "./pages/lessor/EarningsPage";
import CalendarPage from "./pages/lessor/CalendarPage";
import LessorReviewsPage from "./pages/lessor/LessorReviewsPage";
import EditListingPage from "./pages/lessor/EditListingPage";
import LessorSettingsPage from "./pages/lessor/LessorSettingsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminListingsPage from "./pages/admin/AdminListingsPage";
import AdminRentalsPage from "./pages/admin/AdminRentalsPage";
import AdminTransactionsPage from "./pages/admin/AdminTransactionsPage";
import AdminDisputesPage from "./pages/admin/AdminDisputesPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminVerificationsPage from "./pages/admin/AdminVerificationsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminSetupPage from "./pages/admin/AdminSetupPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import { RenterLayout } from "./components/layout/RenterLayout";
import { LessorLayout } from "./components/layout/LessorLayout";

function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (profile.role === "lessor") return <Navigate to="/lessor/dashboard" replace />;
  return <Navigate to="/renter/home" replace />;
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/admin-setup" element={<AdminSetupPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-account" element={<VerifyAccountPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected: identity verification (any authenticated user) */}
            <Route path="/verify-identity" element={<ProtectedRoute><IdentityVerificationPage /></ProtectedRoute>} />

            {/* Role redirect after login */}
            <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

            {/* Renter */}
            <Route path="/renter" element={<ProtectedRoute allowedRoles={["renter"]}><Navigate to="/renter/home" replace /></ProtectedRoute>} />
            <Route path="/renter/home" element={<ProtectedRoute allowedRoles={["renter"]}><RenterHomePage /></ProtectedRoute>} />
            <Route path="/renter/search" element={<ProtectedRoute allowedRoles={["renter"]}><SearchPage /></ProtectedRoute>} />
            <Route path="/renter/listing/:id" element={<ProtectedRoute allowedRoles={["renter"]}><ListingDetailPage /></ProtectedRoute>} />
            <Route path="/renter/request/:id" element={<ProtectedRoute allowedRoles={["renter"]}><RentalRequestPage /></ProtectedRoute>} />
            <Route path="/renter/rentals" element={<ProtectedRoute allowedRoles={["renter"]}><MyRentalsPage /></ProtectedRoute>} />
            <Route path="/renter/rentals/:id" element={<ProtectedRoute allowedRoles={["renter"]}><RentalDetailPage /></ProtectedRoute>} />
            <Route path="/renter/review/:rentalId" element={<ProtectedRoute allowedRoles={["renter"]}><WriteReviewPage /></ProtectedRoute>} />
            <Route path="/renter/messages" element={<ProtectedRoute allowedRoles={["renter"]}><MessagesPage layout={RenterLayout} /></ProtectedRoute>} />
            <Route path="/renter/notifications" element={<ProtectedRoute allowedRoles={["renter"]}><NotificationsPage layout={RenterLayout} /></ProtectedRoute>} />
            <Route path="/renter/profile" element={<ProtectedRoute allowedRoles={["renter"]}><ProfilePage layout={RenterLayout} /></ProtectedRoute>} />

            {/* Lessor */}
            <Route path="/lessor" element={<ProtectedRoute allowedRoles={["lessor"]}><Navigate to="/lessor/dashboard" replace /></ProtectedRoute>} />
            <Route path="/lessor/dashboard" element={<ProtectedRoute allowedRoles={["lessor"]}><LessorDashboardPage /></ProtectedRoute>} />
            <Route path="/lessor/listings" element={<ProtectedRoute allowedRoles={["lessor"]}><ListingsPage /></ProtectedRoute>} />
            <Route path="/lessor/listings/create" element={<ProtectedRoute allowedRoles={["lessor"]}><CreateListingPage /></ProtectedRoute>} />
            <Route path="/lessor/listings/:id" element={<ProtectedRoute allowedRoles={["lessor"]}><EditListingPage /></ProtectedRoute>} />
            <Route path="/lessor/requests" element={<ProtectedRoute allowedRoles={["lessor"]}><LessorRequestsPage /></ProtectedRoute>} />
            <Route path="/lessor/rentals" element={<ProtectedRoute allowedRoles={["lessor"]}><LessorRentalsPage /></ProtectedRoute>} />
            <Route path="/lessor/earnings" element={<ProtectedRoute allowedRoles={["lessor"]}><EarningsPage /></ProtectedRoute>} />
            <Route path="/lessor/calendar" element={<ProtectedRoute allowedRoles={["lessor"]}><CalendarPage /></ProtectedRoute>} />
            <Route path="/lessor/reviews" element={<ProtectedRoute allowedRoles={["lessor"]}><LessorReviewsPage /></ProtectedRoute>} />
            <Route path="/lessor/messages" element={<ProtectedRoute allowedRoles={["lessor"]}><MessagesPage layout={LessorLayout} /></ProtectedRoute>} />
            <Route path="/lessor/notifications" element={<ProtectedRoute allowedRoles={["lessor"]}><NotificationsPage layout={LessorLayout} /></ProtectedRoute>} />
            <Route path="/lessor/profile" element={<ProtectedRoute allowedRoles={["lessor"]}><ProfilePage layout={LessorLayout} /></ProtectedRoute>} />
            <Route path="/lessor/settings" element={<ProtectedRoute allowedRoles={["lessor"]}><LessorSettingsPage /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/listings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminListingsPage /></ProtectedRoute>} />
            <Route path="/admin/rentals" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRentalsPage /></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTransactionsPage /></ProtectedRoute>} />
            <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDisputesPage /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAuditLogsPage /></ProtectedRoute>} />
            <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminVerificationsPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReportsPage /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReviewsPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettingsPage /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
