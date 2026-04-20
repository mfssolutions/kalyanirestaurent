import { useRider } from '../contexts/RiderContext';
import RiderLogin from '../components/RiderLogin';
import RiderDashboard from '../components/RiderDashboard';

export default function RiderPage() {
  const { isRiderAuthenticated } = useRider();

  return isRiderAuthenticated ? <RiderDashboard /> : <RiderLogin />;
}
