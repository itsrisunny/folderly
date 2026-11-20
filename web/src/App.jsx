import { Navigate, Route, Routes } from 'react-router-dom';
import { FolderLock } from 'lucide-react';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Uploads from './pages/Uploads.jsx';
import Reports from './pages/Reports.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="center"><span className="logo boot"><FolderLock size={22} /></span></div>;
  if (!user) return <Login />;
  const admin = user.role === 'admin';
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="uploads" element={<Uploads />} />
        <Route path="profile" element={<Profile />} />
        {admin && <Route path="users" element={<Users />} />}
        {admin && <Route path="reports" element={<Reports />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
