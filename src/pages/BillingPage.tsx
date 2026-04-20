import { BillingProvider } from '../contexts/BillingContext';
import BillingLogin from '../components/BillingLogin';
import BillingDashboard from '../components/BillingDashboard';
import { useBilling } from '../contexts/BillingContext';

function BillingContent() {
  const { billingUser } = useBilling();
  return billingUser ? <BillingDashboard /> : <BillingLogin />;
}

export default function BillingPage() {
  return (
    <BillingProvider>
      <BillingContent />
    </BillingProvider>
  );
}
