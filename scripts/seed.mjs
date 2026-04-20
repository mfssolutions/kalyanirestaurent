// Seed script for Supabase database
// Run: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed.mjs

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars. Usage:\n  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/seed.mjs');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

const menuItems = [
  { id: 'b1', name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', price: 89, category: 'breakfast', is_veg: true, is_available: true, offer: null },
  { id: 'b2', name: 'Idli Sambar', description: 'Steamed rice cakes served with sambar & chutneys', price: 69, category: 'breakfast', is_veg: true, is_available: true, offer: null },
  { id: 'b3', name: 'Upma', description: 'Semolina cooked with vegetables and spices', price: 59, category: 'breakfast', is_veg: true, is_available: true, offer: null },
  { id: 'b4', name: 'Poha', description: 'Flattened rice tempered with peanuts & curry leaves', price: 49, category: 'breakfast', is_veg: true, is_available: true, offer: null },
  { id: 'b5', name: 'Puri Bhaji', description: 'Deep fried bread with spiced potato curry', price: 79, category: 'breakfast', is_veg: true, is_available: true, offer: null },
  { id: 'b6', name: 'Pesarattu', description: 'Green gram dosa with ginger chutney', price: 89, category: 'breakfast', is_veg: true, is_available: true, offer: null },
  { id: 'l1', name: 'Veg Thali', description: 'Complete meal with rice, dal, sabzi, roti, sweet', price: 149, category: 'lunch', is_veg: true, is_available: true, offer: null },
  { id: 'l2', name: 'Non-Veg Thali', description: 'Rice, chicken curry, dal, roti, salad, sweet', price: 199, category: 'lunch', is_veg: false, is_available: true, offer: null },
  { id: 'l3', name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken pieces', price: 229, category: 'lunch', is_veg: false, is_available: true, offer: null },
  { id: 'l4', name: 'Mutton Biryani', description: 'Aromatic rice layered with succulent mutton', price: 289, category: 'lunch', is_veg: false, is_available: true, offer: null },
  { id: 'l5', name: 'Veg Biryani', description: 'Spiced rice with mixed vegetables and herbs', price: 169, category: 'lunch', is_veg: true, is_available: true, offer: null },
  { id: 'l6', name: 'Meals (Rice + 3 Curries)', description: 'South Indian style rice with sambar, rasam, curry', price: 129, category: 'lunch', is_veg: true, is_available: true, offer: null },
  { id: 'sn1', name: 'Samosa (2 pcs)', description: 'Crispy pastry filled with spiced potatoes', price: 39, category: 'snacks', is_veg: true, is_available: true, offer: null },
  { id: 'sn2', name: 'Mirchi Bajji (4 pcs)', description: 'Stuffed chili fritters with peanut filling', price: 49, category: 'snacks', is_veg: true, is_available: true, offer: null },
  { id: 'sn3', name: 'Punugulu (6 pcs)', description: 'Deep fried batter balls served with chutney', price: 49, category: 'snacks', is_veg: true, is_available: true, offer: null },
  { id: 'sn4', name: 'Vada Pav', description: 'Mumbai style spiced potato patty in bread', price: 39, category: 'snacks', is_veg: true, is_available: true, offer: null },
  { id: 'sn5', name: 'Onion Pakoda', description: 'Crispy onion fritters with green chutney', price: 49, category: 'snacks', is_veg: true, is_available: true, offer: null },
  { id: 'sn6', name: 'French Fries', description: 'Crispy golden fries with seasoning', price: 79, category: 'snacks', is_veg: true, is_available: true, offer: null },
  { id: 'st1', name: 'Veg Manchurian', description: 'Crispy vegetable balls in spicy Manchurian sauce', price: 149, category: 'starters', is_veg: true, is_available: true, offer: null },
  { id: 'st2', name: 'Paneer 65', description: 'Crispy paneer cubes tossed in spicy masala', price: 179, category: 'starters', is_veg: true, is_available: true, offer: null },
  { id: 'st3', name: 'Gobi 65', description: 'Crispy cauliflower with aromatic spice coating', price: 139, category: 'starters', is_veg: true, is_available: true, offer: null },
  { id: 'st4', name: 'Spring Rolls (4 pcs)', description: 'Crispy rolls stuffed with vegetables', price: 129, category: 'starters', is_veg: true, is_available: true, offer: null },
  { id: 'st5', name: 'Mushroom Pepper Fry', description: 'Mushrooms stir-fried with pepper and spices', price: 159, category: 'starters', is_veg: true, is_available: true, offer: null },
  { id: 'c1', name: 'Biryani + Raita + Drink', description: 'Chicken biryani with raita and a soft drink', price: 269, category: 'combo', is_veg: false, is_available: true, offer: '15% OFF' },
  { id: 'c2', name: 'Thali + Dessert', description: 'Veg thali with gulab jamun and buttermilk', price: 189, category: 'combo', is_veg: true, is_available: true, offer: '10% OFF' },
  { id: 'c3', name: 'Starter + Main + Dessert', description: 'Manchurian + Veg fried rice + Ice cream', price: 299, category: 'combo', is_veg: true, is_available: true, offer: '20% OFF' },
  { id: 'c4', name: 'Family Pack (4 persons)', description: '2 Biryani + 2 Starters + 4 Drinks + Dessert', price: 899, category: 'combo', is_veg: false, is_available: true, offer: '25% OFF' },
  { id: 'c5', name: 'Couples Special', description: 'Biryani + Starter + 2 Drinks + Dessert', price: 499, category: 'combo', is_veg: false, is_available: true, offer: '18% OFF' },
  { id: 'd1', name: 'Gulab Jamun (2 pcs)', description: 'Soft milk solid balls soaked in sugar syrup', price: 59, category: 'desert', is_veg: true, is_available: true, offer: null },
  { id: 'd2', name: 'Rasmalai (2 pcs)', description: 'Soft cottage cheese patties in saffron milk', price: 79, category: 'desert', is_veg: true, is_available: true, offer: null },
  { id: 'd3', name: 'Double Ka Meetha', description: 'Hyderabadi bread pudding with nuts and saffron', price: 89, category: 'desert', is_veg: true, is_available: true, offer: null },
  { id: 'd4', name: 'Qubani Ka Meetha', description: 'Stewed apricots with cream and ice cream', price: 99, category: 'desert', is_veg: true, is_available: true, offer: null },
  { id: 'd5', name: 'Kulfi', description: 'Traditional Indian ice cream with pistachios', price: 69, category: 'desert', is_veg: true, is_available: true, offer: null },
  { id: 'f1', name: 'Fish Fry', description: 'Crispy fried fish marinated in spicy masala', price: 199, category: 'fish-items', is_veg: false, is_available: true, offer: null },
  { id: 'f2', name: 'Fish Curry', description: 'Tangy fish curry with coconut and tamarind', price: 219, category: 'fish-items', is_veg: false, is_available: true, offer: null },
  { id: 'f3', name: 'Prawn Fry', description: 'Crispy prawns with garlic and pepper seasoning', price: 249, category: 'fish-items', is_veg: false, is_available: true, offer: null },
  { id: 'f4', name: 'Fish Biryani', description: 'Aromatic rice layered with spiced fish pieces', price: 259, category: 'fish-items', is_veg: false, is_available: true, offer: null },
  { id: 'f5', name: 'Prawn Masala', description: 'Succulent prawns in rich spicy gravy', price: 279, category: 'fish-items', is_veg: false, is_available: true, offer: null },
  { id: 'f6', name: 'Apollo Fish', description: 'Crispy fish tossed with onions and spices', price: 229, category: 'fish-items', is_veg: false, is_available: true, offer: null },
  { id: 'ch1', name: 'Chicken 65', description: 'Spicy deep-fried chicken with curry leaves', price: 189, category: 'chicken-specials', is_veg: false, is_available: true, offer: null },
  { id: 'ch2', name: 'Butter Chicken', description: 'Tender chicken in rich creamy tomato gravy', price: 229, category: 'chicken-specials', is_veg: false, is_available: true, offer: null },
  { id: 'ch3', name: 'Chicken Manchurian', description: 'Indo-Chinese chicken in spicy Manchurian sauce', price: 199, category: 'chicken-specials', is_veg: false, is_available: true, offer: null },
  { id: 'ch4', name: 'Tandoori Chicken', description: 'Clay oven roasted chicken with yogurt marinade', price: 249, category: 'chicken-specials', is_veg: false, is_available: true, offer: null },
  { id: 'ch5', name: 'Chicken Lollipop (6 pcs)', description: 'Crispy chicken wings shaped like lollipops', price: 199, category: 'chicken-specials', is_veg: false, is_available: true, offer: null },
  { id: 'ch6', name: 'Chicken Dum Biryani', description: 'Slow-cooked aromatic biryani with chicken', price: 249, category: 'chicken-specials', is_veg: false, is_available: true, offer: null },
  { id: 'sp1', name: 'Kalyani Special Biryani', description: 'Our signature biryani with secret spice blend', price: 299, category: 'special-items', is_veg: false, is_available: true, offer: 'Chef Special' },
  { id: 'sp2', name: 'Mutton Rogan Josh', description: 'Kashmiri style mutton in aromatic gravy', price: 329, category: 'special-items', is_veg: false, is_available: true, offer: null },
  { id: 'sp3', name: 'Paneer Butter Masala', description: 'Cottage cheese in rich buttery tomato gravy', price: 199, category: 'special-items', is_veg: true, is_available: true, offer: null },
  { id: 'sp4', name: 'Hyderabadi Haleem', description: 'Slow-cooked wheat and meat stew (seasonal)', price: 179, category: 'special-items', is_veg: false, is_available: true, offer: 'Seasonal' },
  { id: 'sp5', name: 'Gongura Mutton', description: 'Mutton cooked with tangy sorrel leaves', price: 309, category: 'special-items', is_veg: false, is_available: true, offer: null },
  { id: 'sp6', name: "Chef's Special Thali", description: 'Premium thali with 5 curries, biryani, desserts', price: 399, category: 'special-items', is_veg: false, is_available: true, offer: 'Best Seller' },
];

const banners = [
  { id: 'hb1', title: 'Welcome to Kalyani Restaurant', subtitle: 'Authentic flavors, crafted with love', gradient: 'linear-gradient(135deg, #0d3b1e 0%, #1a6b3c 100%)', image_url: '', is_active: true },
  { id: 'hb2', title: 'Special Weekend Biryani Fest', subtitle: 'Get 20% off on all biryanis this weekend!', gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)', image_url: '', is_active: true },
  { id: 'hb3', title: 'Family Combo Deals', subtitle: 'Feed your family for less — combo packs starting ₹499', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', image_url: '', is_active: true },
];

const offers = [
  { id: 'of1', title: 'Welcome Offer', description: 'Get 10% off on your first order', discount: 10, is_active: true },
  { id: 'of2', title: 'Weekend Special', description: '15% off on all biryanis', discount: 15, is_active: true },
];

async function seed() {
  // Hash the admin password server-side before inserting
  const hashRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hash_password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ raw: 'admin123' }),
  });
  const hashedPassword = hashRes.ok ? (await hashRes.json()) : null;
  if (!hashedPassword) {
    console.error('Failed to hash admin password — ensure migration 20260312200000 has been applied');
    process.exit(1);
  }
  const adminUsers = [
    { phone: '9999999999', password_hash: hashedPassword },
  ];

  console.log('Seeding menu items...');
  let res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(menuItems),
  });
  if (!res.ok) console.error('Menu items error:', await res.text());
  else console.log(`  ✓ ${menuItems.length} menu items inserted`);

  console.log('Seeding banners...');
  res = await fetch(`${SUPABASE_URL}/rest/v1/banners`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(banners),
  });
  if (!res.ok) console.error('Banners error:', await res.text());
  else console.log(`  ✓ ${banners.length} banners inserted`);

  console.log('Seeding offers...');
  res = await fetch(`${SUPABASE_URL}/rest/v1/offers`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(offers),
  });
  if (!res.ok) console.error('Offers error:', await res.text());
  else console.log(`  ✓ ${offers.length} offers inserted`);

  console.log('Seeding admin user...');
  res = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(adminUsers),
  });
  if (!res.ok) console.error('Admin users error:', await res.text());
  else console.log(`  ✓ Admin user inserted`);

  console.log('\n✅ Seeding complete!');
}

seed().catch(console.error);
