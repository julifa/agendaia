import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProfileProvider } from "./hooks/useProfile";
import { PublicSite } from "./pages/PublicSite";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminServices } from "./admin/AdminServices";
import { AdminStaff } from "./admin/AdminStaff";
import { AdminSchedule } from "./admin/AdminSchedule";

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Routes>
          <Route path="/" element={<PublicSite />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="staff/:staffId/schedule" element={<AdminSchedule />} />
          </Route>
        </Routes>
      </ProfileProvider>
    </AuthProvider>
  );
}
