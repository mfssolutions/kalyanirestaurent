import { useAdmin } from '../contexts/AdminContext';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  const { isAdminAuthenticated } = useAdmin();

  return isAdminAuthenticated ? <AdminDashboard /> : <AdminLogin />;
}
