// import { Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import { ToastProvider } from './context/ToastContext';

// import Navbar              from './components/Navbar';
// import Home                from './pages/Home';
// import Login               from './pages/Login';
// import Register            from './pages/Register';
// import DomesticForm        from './pages/DomesticForm';
// import StreetForm          from './pages/StreetForm';
// import CaseTracker         from './pages/CaseTracker';
// import VetRegister         from './pages/VetRegister';
// import VolunteerRegister   from './pages/VolunteerRegister';
// import VetDashboard        from './pages/VetDashboard';
// import VolunteerDashboard  from './pages/VolunteerDashboard';
// import PetProfile          from './pages/PetProfile';
// import RegisterPet         from './pages/RegisterPet';
// import UserDashboard       from './pages/UserDashboard';
// import AboutPage           from './pages/AboutPage';
// import AdminDashboard      from './pages/AdminDashboard';

// const Protected = ({ children }) => {
//   const { user, loading } = useAuth();
//   if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:120 }}><div className="spinner" /></div>;
//   if (!user) {
//     // Carry the current path as ?redirect= so Login sends user back here after signing in
//     const dest = window.location.pathname + window.location.search;
//     return <Navigate to={`/login?redirect=${encodeURIComponent(dest)}`} replace />;
//   }
//   return children;
// };

// const RoleGuard = ({ children, roles }) => {
//   const { user } = useAuth();
//   if (!roles.includes(user?.role)) return <Navigate to="/" replace />;
//   return children;
// };

// const AppRoutes = () => (
//   <>
//     <Navbar />
//     <Routes>
//       <Route path="/"                    element={<Home />} />
//       <Route path="/login"               element={<Login />} />
//       <Route path="/register"            element={<Register />} />
//       <Route path="/join/vet"            element={<VetRegister />} />
//       <Route path="/join/volunteer"      element={<VolunteerRegister />} />
//       <Route path="/pet/:id"             element={<PetProfile />} />
//       <Route path="/about"               element={<AboutPage />} />

//       {/* Street form — public, uses inline OTP auth */}
//       <Route path="/report/street"       element={<StreetForm />} />

//       {/* Authenticated routes */}
//       <Route path="/report/domestic"     element={<Protected><DomesticForm /></Protected>} />
//       <Route path="/track/:caseId"       element={<Protected><CaseTracker /></Protected>} />
//       <Route path="/dashboard"           element={<Protected><UserDashboard /></Protected>} />
//       <Route path="/my-pets/register"    element={<Protected><RegisterPet /></Protected>} />

//       <Route path="/vet/dashboard"       element={
//         <Protected><RoleGuard roles={['vet','admin']}><VetDashboard /></RoleGuard></Protected>
//       } />
//       <Route path="/volunteer/dashboard" element={
//         <Protected><RoleGuard roles={['volunteer','admin']}><VolunteerDashboard /></RoleGuard></Protected>
//       } />

//       <Route
//   path="/admin/dashboard"
//   element={
//     <Protected>
//       <RoleGuard roles={['admin']}>
//         <AdminDashboard />
//       </RoleGuard>
//     </Protected>
//   }
// />

//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   </>
// );

// export default function App() {
//   return (
//     <AuthProvider>
//       <ToastProvider>
//         <AppRoutes />
//       </ToastProvider>
//     </AuthProvider>
//   );
// }

// -------------------------------------------

import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { ToastProvider } from './context/ToastContext';

import Navbar from './components/Navbar';

import Home from './pages/Home';
import Login, { Register } from './pages/Login';
import DomesticForm from './pages/DomesticForm';
import StreetForm from './pages/StreetForm';
import CaseTracker from './pages/CaseTracker';
import VetRegister from './pages/VetRegister';
import VolunteerRegister from './pages/VolunteerRegister';
import VetDashboard from './pages/VetDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import PetProfile from './pages/PetProfile';
import RegisterPet from './pages/RegisterPet';
import UserDashboard from './pages/UserDashboard';
import AboutPage from './pages/AboutPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

const Protected = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 120,
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    const dest = window.location.pathname + window.location.search;

    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(dest)}`}
        replace
      />
    );
  }

  return children;
};

const RoleGuard = ({ children, roles }) => {
  const { user } = useAuth();

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const location = useLocation();

  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pet/:id" element={<PetProfile />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Join */}
        <Route path="/join/vet" element={<VetRegister />} />
        <Route
          path="/join/volunteer"
          element={<VolunteerRegister />}
        />

        {/* Public reporting */}
        <Route path="/report/street" element={<StreetForm />} />

        {/* Protected user routes */}
        <Route
          path="/report/domestic"
          element={
            <Protected>
              <DomesticForm />
            </Protected>
          }
        />

        <Route
          path="/track/:caseId"
          element={
            <Protected>
              <CaseTracker />
            </Protected>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Protected>
              <UserDashboard />
            </Protected>
          }
        />

        <Route
          path="/my-pets/register"
          element={
            <Protected>
              <RegisterPet />
            </Protected>
          }
        />

        {/* Vet Dashboard */}
        <Route
          path="/vet/dashboard"
          element={
            <Protected>
              <RoleGuard roles={['vet', 'admin']}>
                <VetDashboard />
              </RoleGuard>
            </Protected>
          }
        />

        {/* Volunteer Dashboard */}
        <Route
          path="/volunteer/dashboard"
          element={
            <Protected>
              <RoleGuard roles={['volunteer', 'admin']}>
                <VolunteerDashboard />
              </RoleGuard>
            </Protected>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <Protected>
              <RoleGuard roles={['admin']}>
                <AdminDashboard />
              </RoleGuard>
            </Protected>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AdminProvider>
    </AuthProvider>
  );
}