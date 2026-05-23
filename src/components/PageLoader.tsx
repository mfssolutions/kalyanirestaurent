import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageLoader.css';

export default function PageLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => {
    if (firstRender) { setFirstRender(false); return; }
    setVisible(true);
    setProgress(15);
    const t1 = setTimeout(() => setProgress(45), 80);
    const t2 = setTimeout(() => setProgress(75), 220);
    const t3 = setTimeout(() => setProgress(95), 420);
    const t4 = setTimeout(() => setProgress(100), 600);
    const t5 = setTimeout(() => { setVisible(false); setProgress(0); }, 750);
    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      <div className={`page-loader ${visible ? 'show' : ''}`} aria-hidden>
        <div className="page-loader__bar" style={{ width: `${progress}%` }} />
      </div>
      <div className={`page-loader__pill ${visible ? 'show' : ''}`} role="status" aria-live="polite">
        <span className="page-loader__spinner" />
        <span>Loading…</span>
      </div>
    </>
  );
}
