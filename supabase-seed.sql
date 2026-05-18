-- Kainos Tees — Seed Data
-- Run this AFTER supabase-schema.sql in the Supabase SQL Editor

-- COLLECTIONS
insert into collections (id, name, description, icon, bg_color, text_color) values
  ('street-canvas', 'Street Canvas', 'Urban art inspired. 24 designs.', '\u2726', '#1a1a2e', '#fff'),
  ('earth-tone', 'Earth Tone', 'Organic minimal. 18 designs.', '\u25CB', '#f5f0e1', '#111'),
  ('retro-wave', 'Retro Wave', 'Synth meets street. 15 designs.', '\u25C8', '#0d0d0d', '#fff'),
  ('bloom-society', 'Bloom Society', 'Botanical reimagined. 12 designs.', '\u25C7', '#f8f0f0', '#111'),
  ('cyber-punk', 'Cyber Punk', 'Future forward. 10 designs.', '\u25A3', '#1e1e1e', '#fff'),
  ('summer-daze', 'Summer Daze', 'Vacation ready. 20 designs.', '\u25B3', '#faf5eb', '#111')
on conflict (id) do nothing;

-- PRODUCTS
insert into products (name, category, price, old_price, tag, collection_id, image, featured, is_new, rating, reviews, sizes, colors) values
  ('Mountain Graphic Tee', 'Graphic Tees', 38, null, 'Best seller', 'street-canvas', 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=400&h=500&fit=crop', true, false, 4.8, 124, '{XS,S,M,L,XL}', '[{"n":"Black","h":"#111"},{"n":"White","h":"#fff"},{"n":"Gray","h":"#555"}]'),
  ('Relaxed Fit Pocket Tee', 'Oversized Fit', 42, null, 'New', 'bloom-society', 'https://images.unsplash.com/photo-1651761179569-4ba2aa054997?w=400&h=500&fit=crop', false, true, 4.6, 89, '{S,M,L,XL,2XL}', '[{"n":"Navy","h":"#1b3a6b"},{"n":"Black","h":"#111"},{"n":"Cream","h":"#f5f0e1"}]'),
  ('Organic Crew Neck', 'Organic Cotton', 36, null, null, 'earth-tone', 'https://images.unsplash.com/photo-1618677603286-0ec56cb6e1b5?w=400&h=500&fit=crop', false, false, 4.7, 203, '{XS,S,M,L,XL}', '[{"n":"Green","h":"#2d6a4f"},{"n":"White","h":"#fff"},{"n":"Black","h":"#111"}]'),
  ('Abstract Print Tee', 'Limited Edition', 26, 40, 'Sale', 'street-canvas', 'https://images.unsplash.com/photo-1716951884284-4d138f2c42b2?w=400&h=500&fit=crop', false, false, 4.5, 67, '{S,M,L,XL}', '[{"n":"Black","h":"#111"},{"n":"Red","h":"#e84747"}]'),
  ('Heavyweight Box Tee', 'Premium Fit', 48, null, 'New', 'cyber-punk', 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=400&h=500&fit=crop', true, true, 4.9, 156, '{XS,S,M,L,XL,2XL}', '[{"n":"Black","h":"#111"},{"n":"Gray","h":"#555"},{"n":"White","h":"#fff"}]'),
  ('Wash Garment Dye Tee', 'Oversized Fit', 44, null, null, 'earth-tone', 'https://images.unsplash.com/photo-1714070700742-b59b045d2dd9?w=400&h=500&fit=crop', false, false, 4.4, 42, '{S,M,L,XL}', '[{"n":"Cream","h":"#f5f0e1"},{"n":"Gray","h":"#555"}]'),
  ('Minimal Logo Tee', 'Premium Fit', 34, null, 'New', 'cyber-punk', 'https://images.unsplash.com/photo-1622445270936-5dcb604970e7?w=400&h=500&fit=crop', false, true, 4.3, 78, '{XS,S,M,L,XL}', '[{"n":"White","h":"#fff"},{"n":"Black","h":"#111"},{"n":"Navy","h":"#1b3a6b"}]'),
  ('Striped Essential Tee', 'Organic Cotton', 32, null, 'Best seller', 'summer-daze', 'https://images.unsplash.com/photo-1773525912457-6a7278efb9e4?w=400&h=500&fit=crop', true, false, 4.6, 189, '{XS,S,M,L,XL,2XL}', '[{"n":"Red","h":"#e84747"},{"n":"Black","h":"#111"},{"n":"White","h":"#fff"}]'),
  ('Drop Shoulder Tee', 'Oversized Fit', 40, null, null, 'summer-daze', 'https://images.unsplash.com/photo-1622445275649-b1922cc3e837?w=400&h=500&fit=crop', false, false, 4.2, 34, '{S,M,L,XL}', '[{"n":"Gray","h":"#555"},{"n":"Black","h":"#111"}]'),
  ('Solar Flare Tee', 'Limited Edition', 46, null, 'New', 'summer-daze', 'https://images.unsplash.com/photo-1671438118097-479e63198629?w=400&h=500&fit=crop', false, true, 4.7, 93, '{XS,S,M,L,XL}', '[{"n":"Red","h":"#e84747"},{"n":"Black","h":"#111"}]'),
  ('Midnight Run Tee', 'Premium Fit', 42, null, 'New', 'retro-wave', 'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=400&h=500&fit=crop', false, true, 4.5, 112, '{S,M,L,XL,2XL}', '[{"n":"Navy","h":"#1b3a6b"},{"n":"Black","h":"#111"}]'),
  ('Tropical Haze', 'Oversized Fit', 38, null, 'New', 'bloom-society', 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=400&h=500&fit=crop', false, true, 4.8, 145, '{XS,S,M,L}', '[{"n":"Green","h":"#2d6a4f"},{"n":"Red","h":"#e84747"}]'),
  ('Geometric Love Tee', 'Graphic Tees', 36, null, 'New', 'street-canvas', 'https://images.unsplash.com/photo-1651761179569-4ba2aa054997?w=400&h=500&fit=crop', false, true, 4.4, 56, '{XS,S,M,L,XL}', '[{"n":"White","h":"#fff"},{"n":"Black","h":"#111"}]'),
  ('Ocean Depth Tee', 'Organic Cotton', 40, null, 'New', 'earth-tone', 'https://images.unsplash.com/photo-1618677603286-0ec56cb6e1b5?w=400&h=500&fit=crop', false, true, 4.6, 88, '{S,M,L,XL}', '[{"n":"Navy","h":"#1b3a6b"},{"n":"Cream","h":"#f5f0e1"}]'),
  ('Street Code Tee', 'Oversized Fit', 40, null, 'New', 'street-canvas', 'https://images.unsplash.com/photo-1716951884284-4d138f2c42b2?w=400&h=500&fit=crop', false, true, 4.3, 45, '{XS,S,M,L,XL,2XL}', '[{"n":"Black","h":"#111"},{"n":"Gray","h":"#555"}]'),
  ('Vintage Logo Tee', 'Graphic Tees', 18, 30, '-40%', 'retro-wave', 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=400&h=500&fit=crop', false, false, 4.1, 234, '{S,M,L,XL}', '[{"n":"Black","h":"#111"},{"n":"White","h":"#fff"}]'),
  ('Abstract Mind Tee', 'Limited Edition', 16, 36, '-55%', 'cyber-punk', 'https://images.unsplash.com/photo-1714070700742-b59b045d2dd9?w=400&h=500&fit=crop', false, false, 4.0, 67, '{M,L,XL}', '[{"n":"Gray","h":"#555"},{"n":"Black","h":"#111"}]'),
  ('Mountain Graphic Tee', 'Graphic Tees', 28, 40, '-30%', 'summer-daze', 'https://images.unsplash.com/photo-1622445270936-5dcb604970e7?w=400&h=500&fit=crop', false, false, 4.5, 156, '{XS,S,M,L,XL}', '[{"n":"Black","h":"#111"},{"n":"White","h":"#fff"}]'),
  ('Classic Logo Tee', 'Premium Fit', 14, 35, '-60%', 'summer-daze', 'https://images.unsplash.com/photo-1773525912457-6a7278efb9e4?w=400&h=500&fit=crop', false, false, 4.2, 312, '{XS,S,M,L,XL,2XL}', '[{"n":"Black","h":"#111"},{"n":"White","h":"#fff"},{"n":"Gray","h":"#555"}]'),
  ('Tie Dye Dream Tee', 'Oversized Fit', 22, 40, '-45%', 'bloom-society', 'https://images.unsplash.com/photo-1622445275649-b1922cc3e837?w=400&h=500&fit=crop', false, false, 4.6, 178, '{S,M,L,XL}', '[{"n":"Red","h":"#e84747"},{"n":"Gray","h":"#555"}]'),
  ('Retro Stripe Tee', 'Organic Cotton', 20, 40, '-50%', 'retro-wave', 'https://images.unsplash.com/photo-1671438118097-479e63198629?w=400&h=500&fit=crop', false, false, 4.3, 89, '{XS,S,M,L,XL}', '[{"n":"Navy","h":"#1b3a6b"},{"n":"White","h":"#fff"}]'),
  ('Linen Blend Tee', 'Premium Fit', 52, null, null, 'retro-wave', 'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=400&h=500&fit=crop', false, false, 4.7, 56, '{XS,S,M,L,XL}', '[{"n":"Cream","h":"#f5f0e1"},{"n":"White","h":"#fff"},{"n":"Black","h":"#111"}]'),
  ('Patchwork Artist Tee', 'Limited Edition', 54, null, 'New', 'cyber-punk', 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=400&h=500&fit=crop', false, true, 4.9, 23, '{S,M,L,XL}', '[{"n":"Black","h":"#111"},{"n":"Cream","h":"#f5f0e1"}]'),
  ('Eco Logo Tee', 'Organic Cotton', 28, null, null, 'earth-tone', 'https://images.unsplash.com/photo-1651761179569-4ba2aa054997?w=400&h=500&fit=crop', false, false, 4.4, 167, '{XS,S,M,L,XL,2XL}', '[{"n":"Green","h":"#2d6a4f"},{"n":"White","h":"#fff"}]')
on conflict (id) do nothing;
