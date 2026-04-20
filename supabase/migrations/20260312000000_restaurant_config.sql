-- Restaurant configuration table for dynamic settings
CREATE TABLE IF NOT EXISTS restaurant_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default config values
INSERT INTO restaurant_config (key, value) VALUES
  ('restaurant_name', 'Kalyani Restaurant'),
  ('tagline', 'Authentic flavors, served with love'),
  ('phone', '+91 98765 43210'),
  ('email', 'contact@kalyanirestaurant.com'),
  ('address', '64, Sarjapur - Marathahalli Rd, Carmelaram Post, Bellandur, Bengaluru, Karnataka 560035'),
  ('delivery_fee', '30'),
  ('default_tax_rate', '5'),
  ('maps_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.0199492498197!2d77.7065!3d12.9009!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU0JzAzLjIiTiA3N8KwNDInMjMuNCJF!5e0!3m2!1sen!2sin!4v1'),
  ('maps_lat', '12.900889'),
  ('maps_lng', '77.709021')
ON CONFLICT (key) DO NOTHING;

-- Allow public read access
ALTER TABLE restaurant_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON restaurant_config FOR SELECT USING (true);
CREATE POLICY "Admin update access" ON restaurant_config FOR ALL USING (true);
