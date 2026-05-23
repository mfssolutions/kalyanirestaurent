import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageLoader.css';

/**
 * Lightweight top-progress bar that animates on every route change.
 * Provides a perceived loading state between page navigations.
 */
export default function PageLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setVisible(true);
    setProgress(15);
    const t1 = setTimeout(() => setProgress(55), 60);
    const t2 = setTimeout(() => setProgress(85), 180);
    const t3 = setTimeout(() => setProgress(100), 320);
    const t4 = setTimeout(() => { setVisible(false); setProgress(0); }, 480);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [location.pathname]);

  return (
    <div className={`page-loader ${visible ? 'show' : ''}`} aria-hidden>
      <div className="page-loader__bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
