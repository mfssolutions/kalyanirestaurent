import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './NativeTopBar.css';

interface Props {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/**
 * Reusable fixed top bar for non-home native pages (Profile, Orders, Cart…).
 * Web build is unaffected because callers gate rendering with isNative().
 */
export default function NativeTopBar({ title, onBack, right }: Props) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) return onBack();
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <header className="ntb">
      <button type="button" className="ntb-back" onClick={handleBack} aria-label="Back">
        <ArrowLeft size={20} />
      </button>
      <h1 className="ntb-title">{title}</h1>
      <div className="ntb-right">{right}</div>
    </header>
  );
}
