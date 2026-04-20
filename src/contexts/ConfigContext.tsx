import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface ConfigContextType {
  config: Record<string, string>;
  loading: boolean;
  get: (key: string, fallback?: string) => string;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('restaurant_config')
      .select('key, value')
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, string> = {};
          data.forEach((row: { key: string; value: string }) => {
            map[row.key] = row.value;
          });
          setConfig(map);
        }
        setLoading(false);
      });
  }, []);

  const get = (key: string, fallback = '') => config[key] ?? fallback;

  return (
    <ConfigContext.Provider value={{ config, loading, get }}>
      {children}
    </ConfigContext.Provider>
  );
}
