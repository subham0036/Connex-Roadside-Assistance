import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CustomerNewRequest from "./dashboards/Customer/CustomerNewRequest";
import CustomerActiveJob from "./dashboards/Customer/CustomerActiveJob";
import CustomerCompleted from "./dashboards/Customer/CustomerCompleted";
import AdminDashboard from "./dashboards/Admin/AdminDashboard";
import StaffDashboard from "./dashboards/Staff/StaffDashboard";
import GarageDashboard from "./pages/garage/GarageDashboard";
import GarageSetup from "./pages/garage/GarageSetup";
import GarageStaff from "./pages/garage/GarageStaff";
import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import SignupCustomer from "./pages/SignupCustomer";
import SignupMechanic from "./pages/SignupMechanic";
import ErrorBoundary from "./components/common/ErrorBoundary";
import "./index.css";
import "./App.css";

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/login/staff" element={<StaffLogin />} />
          <Route path="/signup/customer" element={<SignupCustomer />} />
          <Route path="/signup/mechanic" element={<SignupMechanic />} />

          <Route path="/customer" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerNewRequest /></ProtectedRoute>} />
          <Route path="/customer/active" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerActiveJob /></ProtectedRoute>} />
          <Route path="/customer/completed" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerCompleted /></ProtectedRoute>} />

          <Route path="/garage" element={<ProtectedRoute allowedRoles={["mechanic"]}><GarageDashboard /></ProtectedRoute>} />
          <Route path="/garage/setup" element={<ProtectedRoute allowedRoles={["mechanic"]}><GarageSetup /></ProtectedRoute>} />
          <Route path="/garage/staff" element={<ProtectedRoute allowedRoles={["mechanic"]}><GarageStaff /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute allowedRoles={["staff"]} loginPath="/staff/login"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

          <Route path="/mechanic" element={<Navigate to="/garage" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
