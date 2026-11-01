-- ==============================================================================
-- Nexus ECOMMERCE — COMPREHENSIVE MOCK DATA SQL SCRIPT
-- Compatible with all 9 migrations:
-- 1. Product Options & Option Values
-- 2. Product Variants (with stock, prices, SKUs, flash sale dates)
-- 3. Variant Option Values junction
-- 4. Multi-Currency Display (Currencies, Store Settings, Exchange Rates)
-- 5. Updated Order Items & Orders (with variant snapshots and display currency)
-- 6. Wishlists
-- 7. Shipment Tracking
-- 8. Order Returns
-- 9. Review Images
-- 10. Promotional Banners
-- 11. Featured Collections & Featured Products
-- 12. Rich Static Pages (About, FAQ, Terms, Privacy, Contact, Shipping)
-- 13. Active Cart Items with Variants
-- 14. Product SEO fields
-- All IDs are RFC 4122 v4 compliant UUIDs. Idempotent with ON CONFLICT.
-- ==============================================================================

-- ==============================================================================
-- 1. MULTI-CURRENCY SETUP (Exchange Rates to Base INR)
-- ==============================================================================
INSERT INTO exchange_rates (currency_code, rate_to_base, updated_at) VALUES
  ('INR', 1.000000, now()),
  ('USD', 0.012000, now()),
  ('EUR', 0.011000, now()),
  ('GBP', 0.009500, now()),
  ('JPY', 1.800000, now())
ON CONFLICT (currency_code) DO UPDATE
SET rate_to_base = EXCLUDED.rate_to_base, updated_at = now();

-- Update store settings base currency
INSERT INTO store_settings (id, base_currency_code) VALUES (true, 'INR')
ON CONFLICT (id) DO UPDATE SET base_currency_code = EXCLUDED.base_currency_code;


-- ==============================================================================
-- 2. PRODUCT OPTIONS (e.g. Color, Size, Switch Type, Capacity, Finish)
-- ==============================================================================
INSERT INTO product_options (id, product_id, name, position) VALUES
  -- 1. AuraPro Wireless Headphones
  ('f0000000-0000-4000-8000-000000000001', '9b83b5b9-85c0-43fa-b094-04b69e489a5c', 'Color', 0),
  ('f0000000-0000-4000-8000-000000000002', '9b83b5b9-85c0-43fa-b094-04b69e489a5c', 'Edition', 1),
  -- 2. SoundPulse Earbuds
  ('f0000000-0000-4000-8000-000000000003', 'be64c5f0-f60f-4544-ae64-21cec3a4a69c', 'Color', 0),
  -- 3. SonicBoom 360 Speaker
  ('f0000000-0000-4000-8000-000000000004', 'd1182527-1cc1-4a9b-8f46-776dad90df64', 'Color', 0),
  -- 4. Verve Horizon Smartwatch Series 5
  ('f0000000-0000-4000-8000-000000000005', '71acf90b-3a6e-4ff7-8379-b66217291d5d', 'Case Size', 0),
  ('f0000000-0000-4000-8000-000000000006', '71acf90b-3a6e-4ff7-8379-b66217291d5d', 'Strap Style', 1),
  -- 5. PulseFit Active Fitness Tracker
  ('f0000000-0000-4000-8000-000000000007', 'a1d7aade-e1bd-410f-becb-41da275335a6', 'Band Color', 0),
  -- 6. Apex Ergo Mechanical Keyboard
  ('f0000000-0000-4000-8000-000000000008', '559356ba-b713-473a-8b45-ab450ca02d8c', 'Switch Type', 0),
  -- 7. GlideMaster Precision Mouse
  ('f0000000-0000-4000-8000-000000000009', 'd21a186f-fd2f-4d5a-a455-4fbfbd683cc9', 'Color', 0),
  -- 8. UltraHub 12-in-1 Dock
  ('f0000000-0000-4000-8000-000000000010', 'f122405e-4147-4a76-a933-a44a8ba9852e', 'Chassis Finish', 0),
  -- 9. Predator X Pro Gaming Headset
  ('f0000000-0000-4000-8000-000000000011', '4f0215a5-7530-47f5-b413-3f76e0e1992f', 'Accent Color', 0),
  -- 10. Vortex RGB Mechanical Keyboard
  ('f0000000-0000-4000-8000-000000000012', 'eda5fc56-c1a9-491b-955a-79e6854dbf86', 'Optical Switch', 0),
  -- 11. HyperSpeed Gaming Mouse
  ('f0000000-0000-4000-8000-000000000013', '1b274c28-f57e-44f3-b4c2-37d7812c94fb', 'Shell Finish', 0),
  -- 12. LumaDesk Architect Lamp
  ('f0000000-0000-4000-8000-000000000014', '16cc8673-4fda-4b3e-8304-972e69d2a80b', 'Finish', 0),
  -- 13. ErgoLift Monitor Arm
  ('f0000000-0000-4000-8000-000000000015', 'da0463c4-fe6f-4494-9185-9c01dab08d0f', 'Mounting Type', 0),
  -- 14. CloudCushion Wrist Rest
  ('f0000000-0000-4000-8000-000000000016', '0fd31840-0261-46be-81c3-3b5e60c77d36', 'Size', 0),
  -- 15. Aether Air Purifier
  ('f0000000-0000-4000-8000-000000000017', 'f3fbba62-fb12-46a9-9c2e-e7fd09b7b493', 'Filter Configuration', 0),
  -- 16. GlowSync Ambient Light Bar
  ('f0000000-0000-4000-8000-000000000018', '902ec073-d666-4d42-8ff4-14761df5a2da', 'Display Size', 0),
  -- 17. MagCharge 3-in-1 Stand
  ('f0000000-0000-4000-8000-000000000019', 'f737f6b5-15db-4d09-9190-3b01dd5f5d02', 'Color', 0),
  -- 18. StreamVision 4K Pro Webcam
  ('f0000000-0000-4000-8000-000000000020', 'd645d5cc-fbfb-4e2a-9aa8-c7bc6e41a572', 'Kit Package', 0),
  -- 19. SoundBar Cinematic 2.1
  ('f0000000-0000-4000-8000-000000000021', 'f878f1d5-d1c2-4b1e-abd0-d4656b3f4d91', 'Grille Finish', 0),
  -- 20. Titan Adventure GPS Watch
  ('f0000000-0000-4000-8000-000000000022', '222ab929-c42a-4d5b-a3c7-ed1b85478021', 'Glass Type', 0),
  -- 21. ChronoSync Game Controller
  ('f0000000-0000-4000-8000-000000000023', '79538904-3e5c-448e-879c-3867531b610a', 'Color Edition', 0),
  -- 22. AeroDesk Standing Desk
  ('f0000000-0000-4000-8000-000000000024', '3b791e48-d020-4eac-aa7a-3c949d4c0811', 'Desktop Size', 0),
  ('f0000000-0000-4000-8000-000000000025', '3b791e48-d020-4eac-aa7a-3c949d4c0811', 'Frame Color', 1),
  -- 23. VaultDrive External SSD
  ('f0000000-0000-4000-8000-000000000026', '309062a7-add7-4cf9-a4dc-110c5935bdea', 'Storage Capacity', 0),
  -- 24. StudioMaster XLR Mic
  ('f0000000-0000-4000-8000-000000000027', '0d4ca0a1-ce44-4f2a-96a1-1387c6648131', 'Package Bundle', 0),
  -- 25. EchoGuard Outdoor Camera
  ('f0000000-0000-4000-8000-000000000028', '23c713ab-00f4-4ec0-a640-2b81e4e398ae', 'Pack Quantity', 0),
  -- 26. HydroPure Smart Water Bottle
  ('f0000000-0000-4000-8000-000000000029', 'a23a1b30-c085-4ed5-9f39-5cb0142e869b', 'Volume Size', 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position;


-- ==============================================================================
-- 3. PRODUCT OPTION VALUES
-- ==============================================================================
INSERT INTO product_option_values (id, option_id, value, position) VALUES
  -- AuraPro Colors & Editions
  ('f1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Midnight Black', 0),
  ('f1000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Lunar Silver', 1),
  ('f1000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'Navy Blue', 2),
  ('f1000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000002', 'Standard', 0),
  ('f1000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000002', 'Pro Spatial ANC', 1),
  -- SoundPulse Colors
  ('f1000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000003', 'Matte Graphite', 0),
  ('f1000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000003', 'Alpine White', 1),
  -- SonicBoom 360 Colors
  ('f1000000-0000-4000-8000-000000000008', 'f0000000-0000-4000-8000-000000000004', 'Ocean Blue', 0),
  ('f1000000-0000-4000-8000-000000000009', 'f0000000-0000-4000-8000-000000000004', 'Volcanic Red', 1),
  ('f1000000-0000-4000-8000-000000000010', 'f0000000-0000-4000-8000-000000000004', 'Stealth Charcoal', 2),
  -- Verve Horizon Watch
  ('f1000000-0000-4000-8000-000000000011', 'f0000000-0000-4000-8000-000000000005', '41mm', 0),
  ('f1000000-0000-4000-8000-000000000012', 'f0000000-0000-4000-8000-000000000005', '45mm', 1),
  ('f1000000-0000-4000-8000-000000000013', 'f0000000-0000-4000-8000-000000000006', 'Sport Silicone', 0),
  ('f1000000-0000-4000-8000-000000000014', 'f0000000-0000-4000-8000-000000000006', 'Titanium Milanese Loop', 1),
  -- PulseFit Colors
  ('f1000000-0000-4000-8000-000000000015', 'f0000000-0000-4000-8000-000000000007', 'Obsidian Black', 0),
  ('f1000000-0000-4000-8000-000000000016', 'f0000000-0000-4000-8000-000000000007', 'Rose Gold', 1),
  ('f1000000-0000-4000-8000-000000000017', 'f0000000-0000-4000-8000-000000000007', 'Mint Green', 2),
  -- Apex Ergo Keyboard Switches
  ('f1000000-0000-4000-8000-000000000018', 'f0000000-0000-4000-8000-000000000008', 'Red Linear', 0),
  ('f1000000-0000-4000-8000-000000000019', 'f0000000-0000-4000-8000-000000000008', 'Brown Tactile', 1),
  ('f1000000-0000-4000-8000-000000000020', 'f0000000-0000-4000-8000-000000000008', 'Blue Clicky', 2),
  -- GlideMaster Mouse Colors
  ('f1000000-0000-4000-8000-000000000021', 'f0000000-0000-4000-8000-000000000009', 'Space Gray', 0),
  ('f1000000-0000-4000-8000-000000000022', 'f0000000-0000-4000-8000-000000000009', 'Polar White', 1),
  -- UltraHub Finishes
  ('f1000000-0000-4000-8000-000000000023', 'f0000000-0000-4000-8000-000000000010', 'Space Gray Aluminum', 0),
  ('f1000000-0000-4000-8000-000000000024', 'f0000000-0000-4000-8000-000000000010', 'Silver Anodized', 1),
  -- Predator X Headset
  ('f1000000-0000-4000-8000-000000000025', 'f0000000-0000-4000-8000-000000000011', 'Stealth Black', 0),
  ('f1000000-0000-4000-8000-000000000026', 'f0000000-0000-4000-8000-000000000011', 'Cyber Green Accent', 1),
  -- Vortex RGB Switches
  ('f1000000-0000-4000-8000-000000000027', 'f0000000-0000-4000-8000-000000000012', 'Optical Red Speed', 0),
  ('f1000000-0000-4000-8000-000000000028', 'f0000000-0000-4000-8000-000000000012', 'Optical Blue Tactile', 1),
  -- HyperSpeed Gaming Mouse
  ('f1000000-0000-4000-8000-000000000029', 'f0000000-0000-4000-8000-000000000013', 'Matte Black', 0),
  ('f1000000-0000-4000-8000-000000000030', 'f0000000-0000-4000-8000-000000000013', 'Glossy White', 1),
  -- LumaDesk Lamp
  ('f1000000-0000-4000-8000-000000000031', 'f0000000-0000-4000-8000-000000000014', 'Matte Black', 0),
  ('f1000000-0000-4000-8000-000000000032', 'f0000000-0000-4000-8000-000000000014', 'Brushed Aluminum', 1),
  -- ErgoLift Arm
  ('f1000000-0000-4000-8000-000000000033', 'f0000000-0000-4000-8000-000000000015', 'Heavy Duty Desk Clamp', 0),
  ('f1000000-0000-4000-8000-000000000034', 'f0000000-0000-4000-8000-000000000015', 'Grommet Hole Mount', 1),
  -- CloudCushion Sizes
  ('f1000000-0000-4000-8000-000000000035', 'f0000000-0000-4000-8000-000000000016', 'Compact TKL (80%)', 0),
  ('f1000000-0000-4000-8000-000000000036', 'f0000000-0000-4000-8000-000000000016', 'Full Size (100%)', 1),
  -- Aether Air Purifier
  ('f1000000-0000-4000-8000-000000000037', 'f0000000-0000-4000-8000-000000000017', 'Standard Medical HEPA', 0),
  ('f1000000-0000-4000-8000-000000000038', 'f0000000-0000-4000-8000-000000000017', 'Pet Odor & Smoke Activated Carbon', 1),
  -- GlowSync Light Bar
  ('f1000000-0000-4000-8000-000000000039', 'f0000000-0000-4000-8000-000000000018', '24" - 27" Monitors', 0),
  ('f1000000-0000-4000-8000-000000000040', 'f0000000-0000-4000-8000-000000000018', '32" - 34" Ultrawide', 1),
  -- MagCharge Colors
  ('f1000000-0000-4000-8000-000000000041', 'f0000000-0000-4000-8000-000000000019', 'Space Gray', 0),
  ('f1000000-0000-4000-8000-000000000042', 'f0000000-0000-4000-8000-000000000019', 'Pearl White', 1),
  -- StreamVision 4K
  ('f1000000-0000-4000-8000-000000000043', 'f0000000-0000-4000-8000-000000000020', 'Camera Only', 0),
  ('f1000000-0000-4000-8000-000000000044', 'f0000000-0000-4000-8000-000000000020', 'Camera + Flexible Tripod', 1),
  -- SoundBar Finishes
  ('f1000000-0000-4000-8000-000000000045', 'f0000000-0000-4000-8000-000000000021', 'Acoustic Black Mesh', 0),
  ('f1000000-0000-4000-8000-000000000046', 'f0000000-0000-4000-8000-000000000021', 'Natural Walnut Veneer', 1),
  -- Titan Watch
  ('f1000000-0000-4000-8000-000000000047', 'f0000000-0000-4000-8000-000000000022', 'Corning Gorilla Solar Glass', 0),
  ('f1000000-0000-4000-8000-000000000048', 'f0000000-0000-4000-8000-000000000022', 'Sapphire Crystal Solar Glass', 1),
  -- ChronoSync Game Controller
  ('f1000000-0000-4000-8000-000000000049', 'f0000000-0000-4000-8000-000000000023', 'Carbon Black', 0),
  ('f1000000-0000-4000-8000-000000000050', 'f0000000-0000-4000-8000-000000000023', 'Cyberpunk Neon Purple', 1),
  ('f1000000-0000-4000-8000-000000000051', 'f0000000-0000-4000-8000-000000000023', 'Glacier White', 2),
  -- AeroDesk Standing Desk
  ('f1000000-0000-4000-8000-000000000052', 'f0000000-0000-4000-8000-000000000024', '140 x 70 cm', 0),
  ('f1000000-0000-4000-8000-000000000053', 'f0000000-0000-4000-8000-000000000024', '160 x 80 cm', 1),
  ('f1000000-0000-4000-8000-000000000054', 'f0000000-0000-4000-8000-000000000025', 'Matte Black Steel', 0),
  ('f1000000-0000-4000-8000-000000000055', 'f0000000-0000-4000-8000-000000000025', 'Arctic White Steel', 1),
  -- VaultDrive SSD
  ('f1000000-0000-4000-8000-000000000056', 'f0000000-0000-4000-8000-000000000026', '1TB NVMe', 0),
  ('f1000000-0000-4000-8000-000000000057', 'f0000000-0000-4000-8000-000000000026', '2TB NVMe', 1),
  ('f1000000-0000-4000-8000-000000000058', 'f0000000-0000-4000-8000-000000000026', '4TB NVMe Pro', 2),
  -- StudioMaster Mic
  ('f1000000-0000-4000-8000-000000000059', 'f0000000-0000-4000-8000-000000000027', 'Microphone Only', 0),
  ('f1000000-0000-4000-8000-000000000060', 'f0000000-0000-4000-8000-000000000027', 'Studio Boom Arm & Shockmount Kit', 1),
  -- EchoGuard Camera
  ('f1000000-0000-4000-8000-000000000061', 'f0000000-0000-4000-8000-000000000028', 'Single Camera Kit', 0),
  ('f1000000-0000-4000-8000-000000000062', 'f0000000-0000-4000-8000-000000000028', '2-Camera Whole Home System', 1),
  -- HydroPure Water Bottle
  ('f1000000-0000-4000-8000-000000000063', 'f0000000-0000-4000-8000-000000000029', '500 ml', 0),
  ('f1000000-0000-4000-8000-000000000064', 'f0000000-0000-4000-8000-000000000029', '750 ml Insulated', 1)
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, position = EXCLUDED.position;


-- ==============================================================================
-- 4. PRODUCT VARIANTS (the actual purchasable SKUs)
-- ==============================================================================
INSERT INTO product_variants (id, product_id, sku, price, compare_at_price, stock_quantity, is_active, sale_price, sale_starts_at, sale_ends_at) VALUES
  -- 1. AuraPro Headphones
  ('f2000000-0000-4000-8000-000000000001', '9b83b5b9-85c0-43fa-b094-04b69e489a5c', 'AURA-BLK-STD', 299.99, 349.99, 25, true, NULL, NULL, NULL),
  ('f2000000-0000-4000-8000-000000000002', '9b83b5b9-85c0-43fa-b094-04b69e489a5c', 'AURA-BLK-PRO', 349.99, 399.99, 12, true, 319.99, now() - interval '1 day', now() + interval '7 days'),
  ('f2000000-0000-4000-8000-000000000003', '9b83b5b9-85c0-43fa-b094-04b69e489a5c', 'AURA-SLV-PRO', 349.99, 399.99, 8, true, NULL, NULL, NULL),
  -- 2. SoundPulse Earbuds
  ('f2000000-0000-4000-8000-000000000004', 'be64c5f0-f60f-4544-ae64-21cec3a4a69c', 'SP-EAR-BLK', 79.99, 99.99, 70, true, 69.99, now() - interval '2 days', now() + interval '5 days'),
  ('f2000000-0000-4000-8000-000000000005', 'be64c5f0-f60f-4544-ae64-21cec3a4a69c', 'SP-EAR-WHT', 79.99, 99.99, 50, true, NULL, NULL, NULL),
  -- 3. SonicBoom 360 Speaker
  ('f2000000-0000-4000-8000-000000000006', 'd1182527-1cc1-4a9b-8f46-776dad90df64', 'SBOOM-BLU', 129.50, 149.99, 15, true, NULL, NULL, NULL),
  ('f2000000-0000-4000-8000-000000000007', 'd1182527-1cc1-4a9b-8f46-776dad90df64', 'SBOOM-RED', 129.50, 149.99, 10, true, NULL, NULL, NULL),
  ('f2000000-0000-4000-8000-000000000008', 'd1182527-1cc1-4a9b-8f46-776dad90df64', 'SBOOM-BLK', 129.50, 149.99, 5, true, 114.99, now() - interval '3 days', now() + interval '4 days'),
  -- 4. Verve Horizon Watch
  ('f2000000-0000-4000-8000-000000000009', '71acf90b-3a6e-4ff7-8379-b66217291d5d', 'VRV-41-SPT', 249.00, 299.00, 10, true, NULL, NULL, NULL),
  ('f2000000-0000-4000-8000-000000000010', '71acf90b-3a6e-4ff7-8379-b66217291d5d', 'VRV-45-SPT', 279.00, 329.00, 8, true, NULL, NULL, NULL),
  -- 5. PulseFit Fitness Tracker
  ('f2000000-0000-4000-8000-000000000011', 'a1d7aade-e1bd-410f-becb-41da275335a6', 'PF-FIT-BLK', 49.99, 59.99, 45, true, NULL, NULL, NULL),
  ('f2000000-0000-4000-8000-000000000012', 'a1d7aade-e1bd-410f-becb-41da275335a6', 'PF-FIT-GLD', 49.99, 59.99, 30, true, NULL, NULL, NULL),
  -- 6. Apex Ergo Keyboard
  ('f2000000-0000-4000-8000-000000000013', '559356ba-b713-473a-8b45-ab450ca02d8c', 'APX-KB-RED', 139.00, 169.00, 30, true, NULL, NULL, NULL),
  ('f2000000-0000-4000-8000-000000000014', '559356ba-b713-473a-8b45-ab450ca02d8c', 'APX-KB-BRN', 139.00, 169.00, 25, true, NULL, NULL, NULL),
  -- 7. GlideMaster Mouse
  ('f2000000-0000-4000-8000-000000000015', 'd21a186f-fd2f-4d5a-a455-4fbfbd683cc9', 'GM-MS-GRY', 89.99, 109.99, 45, true, 79.99, now() - interval '1 day', now() + interval '10 days'),
  ('f2000000-0000-4000-8000-000000000016', 'd21a186f-fd2f-4d5a-a455-4fbfbd683cc9', 'GM-MS-WHT', 89.99, 109.99, 30, true, NULL, NULL, NULL),
  -- 8. UltraHub 12-in-1 Dock
  ('f2000000-0000-4000-8000-000000000017', 'f122405e-4147-4a76-a933-a44a8ba9852e', 'UH-12-GRY', 119.00, 139.00, 22, true, NULL, NULL, NULL),
  ('f2000000-0000-4000-8000-000000000018', 'f122405e-4147-4a76-a933-a44a8ba9852e', 'UH-12-SLV', 119.00, 139.00, 18, true, NULL, NULL, NULL),
  -- 9. Predator X Gaming Headset
  ('f2000000-0000-4000-8000-000000000019', '4f0215a5-7530-47f5-b413-3f76e0e1992f', 'PX-HEAD-RED', 159.99, 189.99, 14, true, NULL, NULL, NULL),
  -- 10. Vortex RGB Keyboard
  ('f2000000-0000-4000-8000-000000000020', 'eda5fc56-c1a9-491b-955a-79e6854dbf86', 'VTX-OPT-RED', 149.99, 179.99, 20, true, 134.99, now() - interval '1 day', now() + interval '3 days'),
  -- 11. HyperSpeed Mouse
  ('f2000000-0000-4000-8000-000000000021', '1b274c28-f57e-44f3-b4c2-37d7812c94fb', 'HS-MSE-BLK', 69.99, 79.99, 30, true, NULL, NULL, NULL),
  -- 12. LumaDesk Lamp
  ('f2000000-0000-4000-8000-000000000022', '16cc8673-4fda-4b3e-8304-972e69d2a80b', 'LUMA-LMP-BLK', 64.99, 79.99, 16, true, NULL, NULL, NULL),
  -- 13. ErgoLift Arm
  ('f2000000-0000-4000-8000-000000000023', 'da0463c4-fe6f-4494-9185-9c01dab08d0f', 'ERGO-ARM-CLP', 89.00, 119.00, 12, true, NULL, NULL, NULL),
  -- 14. CloudCushion Rest
  ('f2000000-0000-4000-8000-000000000024', '0fd31840-0261-46be-81c3-3b5e60c77d36', 'CC-REST-TKL', 24.99, 29.99, 60, true, NULL, NULL, NULL),
  -- 15. Aether Air Purifier
  ('f2000000-0000-4000-8000-000000000025', 'f3fbba62-fb12-46a9-9c2e-e7fd09b7b493', 'AETH-PUR-STD', 189.00, 229.00, 10, true, NULL, NULL, NULL),
  -- 16. GlowSync Light Bar
  ('f2000000-0000-4000-8000-000000000026', '902ec073-d666-4d42-8ff4-14761df5a2da', 'GLOW-BAR-27', 74.99, 89.99, 38, true, NULL, NULL, NULL),
  -- 17. MagCharge 3-in-1
  ('f2000000-0000-4000-8000-000000000027', 'f737f6b5-15db-4d09-9190-3b01dd5f5d02', 'MC-3IN1-GRY', 59.99, 69.99, 50, true, NULL, NULL, NULL),
  -- 18. StreamVision 4K
  ('f2000000-0000-4000-8000-000000000028', 'd645d5cc-fbfb-4e2a-9aa8-c7bc6e41a572', 'SV-4K-STD', 129.99, 159.99, 25, true, NULL, NULL, NULL),
  -- 19. SoundBar Cinematic
  ('f2000000-0000-4000-8000-000000000029', 'f878f1d5-d1c2-4b1e-abd0-d4656b3f4d91', 'SB-21-BLK', 199.99, 249.99, 12, true, NULL, NULL, NULL),
  -- 20. Titan Adventure Watch
  ('f2000000-0000-4000-8000-000000000030', '222ab929-c42a-4d5b-a3c7-ed1b85478021', 'TTN-ADV-STD', 449.00, 499.00, 6, true, NULL, NULL, NULL),
  -- 21. ChronoSync Gamepad
  ('f2000000-0000-4000-8000-000000000031', '79538904-3e5c-448e-879c-3867531b610a', 'CS-CTRL-BLK', 59.99, 69.99, 30, true, NULL, NULL, NULL),
  -- 22. AeroDesk Standing Desk
  ('f2000000-0000-4000-8000-000000000032', '3b791e48-d020-4eac-aa7a-3c949d4c0811', 'AD-140-BLK', 389.00, 459.00, 5, true, NULL, NULL, NULL),
  -- 23. VaultDrive 2TB SSD
  ('f2000000-0000-4000-8000-000000000033', '309062a7-add7-4cf9-a4dc-110c5935bdea', 'VD-SSD-2TB', 169.99, 199.99, 20, true, NULL, NULL, NULL),
  -- 24. StudioMaster XLR Mic (draft sample, 0 stock)
  ('f2000000-0000-4000-8000-000000000034', '0d4ca0a1-ce44-4f2a-96a1-1387c6648131', 'SM-XLR-STD', 149.00, 179.00, 0, false, NULL, NULL, NULL),
  -- 25. EchoGuard 2K Camera
  ('f2000000-0000-4000-8000-000000000035', '23c713ab-00f4-4ec0-a640-2b81e4e398ae', 'EG-CAM-1PK', 99.99, 129.99, 15, true, NULL, NULL, NULL),
  -- 26. HydroPure Water Bottle
  ('f2000000-0000-4000-8000-000000000036', 'a23a1b30-c085-4ed5-9f39-5cb0142e869b', 'HP-BOT-500', 39.99, 49.99, 35, true, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET 
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  sale_price = EXCLUDED.sale_price,
  sale_starts_at = EXCLUDED.sale_starts_at,
  sale_ends_at = EXCLUDED.sale_ends_at;


-- ==============================================================================
-- 5. VARIANT <-> OPTION VALUE JUNCTION
-- ==============================================================================
INSERT INTO variant_option_values (variant_id, option_value_id) VALUES
  -- AuraPro
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'), -- Midnight Black
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000004'), -- Standard
  ('f2000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001'), -- Midnight Black
  ('f2000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000005'), -- Pro Spatial ANC
  ('f2000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000002'), -- Lunar Silver
  ('f2000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000005'), -- Pro Spatial ANC
  -- SoundPulse
  ('f2000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000006'), -- Matte Graphite
  ('f2000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000007'), -- Alpine White
  -- SonicBoom 360
  ('f2000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000008'), -- Ocean Blue
  ('f2000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000009'), -- Volcanic Red
  ('f2000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000010'), -- Stealth Charcoal
  -- Verve Watch
  ('f2000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000011'), -- 41mm
  ('f2000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000013'), -- Sport Silicone
  ('f2000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000012'), -- 45mm
  ('f2000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000013'), -- Sport Silicone
  -- PulseFit
  ('f2000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000015'), -- Obsidian Black
  ('f2000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000016'), -- Rose Gold
  -- Apex Ergo
  ('f2000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000018'), -- Red Linear
  ('f2000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000019'), -- Brown Tactile
  -- GlideMaster Mouse
  ('f2000000-0000-4000-8000-000000000015', 'f1000000-0000-4000-8000-000000000021'), -- Space Gray
  ('f2000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000022'), -- Polar White
  -- UltraHub Dock
  ('f2000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000023'), -- Space Gray
  ('f2000000-0000-4000-8000-000000000018', 'f1000000-0000-4000-8000-000000000024'), -- Silver
  -- Predator X Headset
  ('f2000000-0000-4000-8000-000000000019', 'f1000000-0000-4000-8000-000000000025'), -- Stealth Black
  -- Vortex Keyboard
  ('f2000000-0000-4000-8000-000000000020', 'f1000000-0000-4000-8000-000000000027'), -- Optical Red
  -- HyperSpeed Mouse
  ('f2000000-0000-4000-8000-000000000021', 'f1000000-0000-4000-8000-000000000029'), -- Matte Black
  -- LumaDesk Lamp
  ('f2000000-0000-4000-8000-000000000022', 'f1000000-0000-4000-8000-000000000031'), -- Matte Black
  -- ErgoLift Arm
  ('f2000000-0000-4000-8000-000000000023', 'f1000000-0000-4000-8000-000000000033'), -- Desk Clamp
  -- CloudCushion
  ('f2000000-0000-4000-8000-000000000024', 'f1000000-0000-4000-8000-000000000035'), -- Compact TKL
  -- Aether Purifier
  ('f2000000-0000-4000-8000-000000000025', 'f1000000-0000-4000-8000-000000000037'), -- Standard HEPA
  -- GlowSync Light Bar
  ('f2000000-0000-4000-8000-000000000026', 'f1000000-0000-4000-8000-000000000039'), -- 24"-27"
  -- MagCharge
  ('f2000000-0000-4000-8000-000000000027', 'f1000000-0000-4000-8000-000000000041'), -- Space Gray
  -- StreamVision 4K
  ('f2000000-0000-4000-8000-000000000028', 'f1000000-0000-4000-8000-000000000043'), -- Camera Only
  -- SoundBar
  ('f2000000-0000-4000-8000-000000000029', 'f1000000-0000-4000-8000-000000000045'), -- Acoustic Black
  -- Titan Watch
  ('f2000000-0000-4000-8000-000000000030', 'f1000000-0000-4000-8000-000000000047'), -- Gorilla Solar
  -- ChronoSync Gamepad
  ('f2000000-0000-4000-8000-000000000031', 'f1000000-0000-4000-8000-000000000049'), -- Carbon Black
  -- AeroDesk
  ('f2000000-0000-4000-8000-000000000032', 'f1000000-0000-4000-8000-000000000052'), -- 140x70
  ('f2000000-0000-4000-8000-000000000032', 'f1000000-0000-4000-8000-000000000054'), -- Black Steel
  -- VaultDrive SSD
  ('f2000000-0000-4000-8000-000000000033', 'f1000000-0000-4000-8000-000000000057'), -- 2TB
  -- StudioMaster
  ('f2000000-0000-4000-8000-000000000034', 'f1000000-0000-4000-8000-000000000059'), -- Mic Only
  -- EchoGuard
  ('f2000000-0000-4000-8000-000000000035', 'f1000000-0000-4000-8000-000000000061'), -- Single Camera
  -- HydroPure Bottle
  ('f2000000-0000-4000-8000-000000000036', 'f1000000-0000-4000-8000-000000000063')  -- 500 ml
ON CONFLICT (variant_id, option_value_id) DO NOTHING;


-- ==============================================================================
-- 6. LINK PRODUCT IMAGES TO VARIANTS
-- ==============================================================================
UPDATE product_images SET variant_id = 'f2000000-0000-4000-8000-000000000001'
WHERE product_id = '9b83b5b9-85c0-43fa-b094-04b69e489a5c' AND position = 0;

UPDATE product_images SET variant_id = 'f2000000-0000-4000-8000-000000000004'
WHERE product_id = 'be64c5f0-f60f-4544-ae64-21cec3a4a69c' AND position = 0;

UPDATE product_images SET variant_id = 'f2000000-0000-4000-8000-000000000009'
WHERE product_id = '71acf90b-3a6e-4ff7-8379-b66217291d5d' AND position = 0;


-- ==============================================================================
-- 7. UPDATE PRODUCT SEO METADATA
-- ==============================================================================
UPDATE products SET 
  meta_title = name || ' — High Performance Gear | Nexus',
  meta_description = substring(description from 1 for 155),
  og_image_url = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop&q=80'
WHERE meta_title IS NULL;


-- ==============================================================================
-- 8. UPDATE EXISTING ORDER ITEMS WITH VARIANT SNAPSHOTS
-- ==============================================================================
UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000001',
  variant_label = 'Color: Midnight Black, Edition: Standard'
WHERE product_id = '9b83b5b9-85c0-43fa-b094-04b69e489a5c' AND variant_id IS NULL;

UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000004',
  variant_label = 'Color: Matte Graphite'
WHERE product_id = 'be64c5f0-f60f-4544-ae64-21cec3a4a69c' AND variant_id IS NULL;

UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000009',
  variant_label = 'Case Size: 41mm, Strap Style: Sport Silicone'
WHERE product_id = '71acf90b-3a6e-4ff7-8379-b66217291d5d' AND variant_id IS NULL;

UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000006',
  variant_label = 'Color: Ocean Blue'
WHERE product_id = 'd1182527-1cc1-4a9b-8f46-776dad90df64' AND variant_id IS NULL;

UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000032',
  variant_label = 'Desktop Size: 140 x 70 cm, Frame Color: Matte Black Steel'
WHERE product_id = '3b791e48-d020-4eac-aa7a-3c949d4c0811' AND variant_id IS NULL;

UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000028',
  variant_label = 'Kit Package: Camera Only'
WHERE product_id = 'd645d5cc-fbfb-4e2a-9aa8-c7bc6e41a572' AND variant_id IS NULL;

UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000025',
  variant_label = 'Filter Configuration: Standard Medical HEPA'
WHERE product_id = 'f3fbba62-fb12-46a9-9c2e-e7fd09b7b493' AND variant_id IS NULL;

UPDATE order_items SET
  variant_id = 'f2000000-0000-4000-8000-000000000030',
  variant_label = 'Glass Type: Corning Gorilla Solar Glass'
WHERE product_id = '222ab929-c42a-4d5b-a3c7-ed1b85478021' AND variant_id IS NULL;

-- Set orders display currency snapshot
UPDATE orders SET
  display_currency_code = 'USD',
  display_total = total
WHERE display_currency_code IS NULL;


-- ==============================================================================
-- 9. CART ITEMS (Active User Shopping Carts)
-- ==============================================================================
-- Remove old cart items if any without variant_id
DELETE FROM cart_items WHERE variant_id IS NULL;

INSERT INTO cart_items (id, user_id, product_id, variant_id, quantity, created_at) VALUES
  (
    'f3000000-0000-4000-8000-000000000001',
    'a1111111-1111-4111-8111-111111111111',
    '9b83b5b9-85c0-43fa-b094-04b69e489a5c',
    'f2000000-0000-4000-8000-000000000002', -- AuraPro Pro ANC
    1,
    now() - interval '2 hours'
  ),
  (
    'f3000000-0000-4000-8000-000000000002',
    'a1111111-1111-4111-8111-111111111111',
    'be64c5f0-f60f-4544-ae64-21cec3a4a69c',
    'f2000000-0000-4000-8000-000000000004', -- SoundPulse Earbuds
    2,
    now() - interval '1 hour'
  ),
  (
    'f3000000-0000-4000-8000-000000000003',
    'a2222222-2222-4222-8222-222222222222',
    '559356ba-b713-473a-8b45-ab450ca02d8c',
    'f2000000-0000-4000-8000-000000000013', -- Apex Ergo Keyboard
    1,
    now() - interval '30 minutes'
  )
ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity;


-- ==============================================================================
-- 10. WISHLISTS
-- ==============================================================================
INSERT INTO wishlists (id, user_id, product_id, created_at) VALUES
  ('f4000000-0000-4000-8000-000000000001', 'a1111111-1111-4111-8111-111111111111', '71acf90b-3a6e-4ff7-8379-b66217291d5d', now() - interval '10 days'),
  ('f4000000-0000-4000-8000-000000000002', 'a1111111-1111-4111-8111-111111111111', '3b791e48-d020-4eac-aa7a-3c949d4c0811', now() - interval '5 days'),
  ('f4000000-0000-4000-8000-000000000003', 'a2222222-2222-4222-8222-222222222222', '9b83b5b9-85c0-43fa-b094-04b69e489a5c', now() - interval '12 days'),
  ('f4000000-0000-4000-8000-000000000004', 'a2222222-2222-4222-8222-222222222222', '222ab929-c42a-4d5b-a3c7-ed1b85478021', now() - interval '2 days'),
  ('f4000000-0000-4000-8000-000000000005', 'a3333333-3333-4333-8333-333333333333', 'd645d5cc-fbfb-4e2a-9aa8-c7bc6e41a572', now() - interval '15 days')
ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- 11. SHIPMENTS (Package Delivery Tracking)
-- ==============================================================================
INSERT INTO shipments (id, order_id, carrier, tracking_number, status, shipped_at, delivered_at, estimated_delivery, created_at) VALUES
  (
    'f5000000-0000-4000-8000-000000000001',
    'c0010000-0000-4000-8000-000000000001',
    'FedEx Express',
    'FX-7892182910',
    'delivered',
    '2026-01-16 09:00:00+00',
    '2026-01-18 14:35:00+00',
    '2026-01-18',
    '2026-01-15 11:00:00+00'
  ),
  (
    'f5000000-0000-4000-8000-000000000002',
    'c0020000-0000-4000-8000-000000000001',
    'DHL Priority',
    'DHL-9920194812',
    'delivered',
    '2026-02-11 10:00:00+00',
    '2026-02-13 16:20:00+00',
    '2026-02-13',
    '2026-02-10 12:00:00+00'
  ),
  (
    'f5000000-0000-4000-8000-000000000003',
    'c0090000-0000-4000-8000-000000000001',
    'UPS Air Saver',
    '1Z9999999999999999',
    'shipped',
    '2026-09-03 11:30:00+00',
    NULL,
    '2026-09-24',
    '2026-09-02 10:00:00+00'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  tracking_number = EXCLUDED.tracking_number,
  shipped_at = EXCLUDED.shipped_at,
  delivered_at = EXCLUDED.delivered_at;


-- ==============================================================================
-- 12. RETURNS / REFUNDS
-- ==============================================================================
INSERT INTO returns (id, order_id, user_id, reason, status, refund_amount, stripe_refund_id, requested_at, resolved_at) VALUES
  (
    'f6000000-0000-4000-8000-000000000001',
    'c0060000-0000-4000-8000-000000000002',
    'a6666666-6666-4666-8666-666666666666',
    'Item was ordered by mistake; wanted the speaker in blue rather than charcoal.',
    'approved',
    139.50,
    're_test_98319203912',
    '2026-06-22 10:00:00+00',
    '2026-06-23 15:30:00+00'
  ),
  (
    'f6000000-0000-4000-8000-000000000002',
    'c0090000-0000-4000-8000-000000000002',
    'a3333333-3333-4333-8333-333333333333',
    'Standing desk top color does not match my office flooring.',
    'requested',
    364.00,
    NULL,
    '2026-09-08 14:15:00+00',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, refund_amount = EXCLUDED.refund_amount;


-- ==============================================================================
-- 13. REVIEW IMAGES
-- ==============================================================================
INSERT INTO review_images (id, review_id, url, position) VALUES
  (
    'f7000000-0000-4000-8000-000000000001',
    'e0010000-0000-4000-8000-000000000001',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&fit=crop&q=80',
    0
  ),
  (
    'f7000000-0000-4000-8000-000000000002',
    'e0010000-0000-4000-8000-000000000001',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop&q=80',
    1
  ),
  (
    'f7000000-0000-4000-8000-000000000003',
    'e0030000-0000-4000-8000-000000000003',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop&q=80',
    0
  )
ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url;


-- ==============================================================================
-- 14. PROMOTIONAL HERO BANNERS
-- ==============================================================================
INSERT INTO banners (id, title, subtitle, image_url, link_url, position, is_active, starts_at, ends_at) VALUES
  (
    'f8000000-0000-4000-8000-000000000001',
    'Immerse in Pure Sound',
    'Experience next-generation hybrid noise cancellation with the AuraPro Series.',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1600&h=700&fit=crop&q=85',
    '/products/aurapro-wireless-headphones',
    0,
    true,
    NULL,
    NULL
  ),
  (
    'f8000000-0000-4000-8000-000000000002',
    'Uncompromising Tactical Precision',
    'Explore the Titan Adventure GPS Smartwatch built with solar charging and topo maps.',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&h=700&fit=crop&q=85',
    '/products/titan-adventure-gps-smartwatch',
    1,
    true,
    NULL,
    NULL
  ),
  (
    'f8000000-0000-4000-8000-000000000003',
    'Elevate Your Workspace',
    'Ultra-quiet dual motor standing desks and ergonomic wireless accessories.',
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1600&h=700&fit=crop&q=85',
    '/category/home-office',
    2,
    true,
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active;


-- ==============================================================================
-- 15. FEATURED COLLECTIONS
-- ==============================================================================
INSERT INTO featured_collections (id, category_id, label, image_url, position, is_active) VALUES
  (
    'f9000000-0000-4000-8000-000000000001',
    '0f0f48d5-9f48-44dc-b385-3025f248d620', -- Audio
    'Studio-Grade Acoustics',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&h=400&fit=crop&q=80',
    0,
    true
  ),
  (
    'f9000000-0000-4000-8000-000000000002',
    '5fec32f9-69bc-439d-86de-e94758399f98', -- Wearables
    'Smart Life & Bio-Tracking',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=400&fit=crop&q=80',
    1,
    true
  ),
  (
    'f9000000-0000-4000-8000-000000000003',
    'c52d0053-2dce-4e04-9602-c7bd946ef6ab', -- Gaming
    'Esports Tournament Peripherals',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop&q=80',
    2,
    true
  ),
  (
    'f9000000-0000-4000-8000-000000000004',
    '6a87be1c-9508-478f-9ddb-a3029132e674', -- Accessories
    'Productivity & Connectivity',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=400&fit=crop&q=80',
    3,
    true
  )
ON CONFLICT (category_id) DO UPDATE SET
  label = EXCLUDED.label,
  image_url = EXCLUDED.image_url,
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active;


-- ==============================================================================
-- 16. FEATURED PRODUCTS (Curated Homepage Sections)
-- ==============================================================================
INSERT INTO featured_products (id, product_id, section, position, is_active) VALUES
  -- Featured
  ('fa000000-0000-4000-8000-000000000001', '9b83b5b9-85c0-43fa-b094-04b69e489a5c', 'featured', 0, true),
  ('fa000000-0000-4000-8000-000000000002', '71acf90b-3a6e-4ff7-8379-b66217291d5d', 'featured', 1, true),
  ('fa000000-0000-4000-8000-000000000003', '559356ba-b713-473a-8b45-ab450ca02d8c', 'featured', 2, true),
  ('fa000000-0000-4000-8000-000000000004', '3b791e48-d020-4eac-aa7a-3c949d4c0811', 'featured', 3, true),
  -- New Arrivals
  ('fa000000-0000-4000-8000-000000000005', '222ab929-c42a-4d5b-a3c7-ed1b85478021', 'new_arrivals', 0, true),
  ('fa000000-0000-4000-8000-000000000006', 'f737f6b5-15db-4d09-9190-3b01dd5f5d02', 'new_arrivals', 1, true),
  ('fa000000-0000-4000-8000-000000000007', '309062a7-add7-4cf9-a4dc-110c5935bdea', 'new_arrivals', 2, true),
  ('fa000000-0000-4000-8000-000000000008', 'd645d5cc-fbfb-4e2a-9aa8-c7bc6e41a572', 'new_arrivals', 3, true),
  -- Best Sellers
  ('fa000000-0000-4000-8000-000000000009', 'be64c5f0-f60f-4544-ae64-21cec3a4a69c', 'best_sellers', 0, true),
  ('fa000000-0000-4000-8000-000000000010', 'd21a186f-fd2f-4d5a-a455-4fbfbd683cc9', 'best_sellers', 1, true),
  ('fa000000-0000-4000-8000-000000000011', 'd1182527-1cc1-4a9b-8f46-776dad90df64', 'best_sellers', 2, true),
  ('fa000000-0000-4000-8000-000000000012', '79538904-3e5c-448e-879c-3867531b610a', 'best_sellers', 3, true),
  -- Trending
  ('fa000000-0000-4000-8000-000000000013', '4f0215a5-7530-47f5-b413-3f76e0e1992f', 'trending', 0, true),
  ('fa000000-0000-4000-8000-000000000014', '902ec073-d666-4d42-8ff4-14761df5a2da', 'trending', 1, true),
  ('fa000000-0000-4000-8000-000000000015', 'f3fbba62-fb12-46a9-9c2e-e7fd09b7b493', 'trending', 2, true),
  ('fa000000-0000-4000-8000-000000000016', 'eda5fc56-c1a9-491b-955a-79e6854dbf86', 'trending', 3, true)
ON CONFLICT (product_id, section) DO UPDATE SET
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active;


-- ==============================================================================
-- 17. STATIC CONTENT PAGES (Published with Rich Copy)
-- ==============================================================================
INSERT INTO pages (id, slug, title, content, meta_title, meta_description, is_published) VALUES
  (
    'fb000000-0000-4000-8000-000000000001',
    'about',
    'About Nexus',
    '## Engineering Without Compromise

Founded in 2024, **Nexus** designs and manufactures ultra-premium consumer electronics, audio hardware, and workspace ergonomics for professionals, audiophiles, and creators worldwide.

### Our Philosophy
- **Precision Engineering:** Every component is crafted from aerospace-grade materials, precision machined, and tested to extreme standards.
- **Form Follows Emotion:** We believe technology should look as exquisite as it performs.
- **Sustainable Longevity:** Modular components and long-life batteries designed to reduce technological obsolescence.',
    'About Nexus — Precision Engineering & Hardware Design',
    'Discover the story, mission, and relentless pursuit of engineering perfection behind Nexus consumer hardware.',
    true
  ),
  (
    'fb000000-0000-4000-8000-000000000002',
    'faq',
    'Frequently Asked Questions',
    '## Help Center & Frequently Asked Questions

### 1. How fast is shipping?
We offer standard express shipping (3-5 business days) across North America and Europe. Orders placed before 2:00 PM EST ship the same business day.

### 2. What is your warranty policy?
All Nexus hardware products come backed by a comprehensive **2-Year Limited Global Warranty** covering manufacturing defects, battery health, and mechanical parts.

### 3. What is the return window?
You have **30 days** from the delivery date to initiate a hassle-free return on any hardware in its original packaging.',
    'Help Center & FAQ — Nexus Support',
    'Find quick answers regarding Nexus product warranties, expedited shipping, returns, and order tracking.',
    true
  ),
  (
    'fb000000-0000-4000-8000-000000000003',
    'terms',
    'Terms & Conditions',
    '## Terms and Conditions of Sale

Welcome to Nexus. By browsing, accessing, or making a purchase on this website, you agree to comply with and be bound by the following terms.

1. **Purchases and Pricing:** Prices are displayed in your selected local currency. Charges are settled securely via Stripe.
2. **Order Fulfillment:** We reserve the right to cancel or adjust orders in the event of unforeseen inventory shortages or pricing inaccuracies.
3. **Limitation of Liability:** Nexus shall not be held liable for indirect, incidental, or consequential damages resulting from product misuse.',
    'Terms and Conditions — Nexus Legal',
    'Read the legal terms, sale conditions, and usage policies governing Nexus online store and services.',
    true
  ),
  (
    'fb000000-0000-4000-8000-000000000004',
    'privacy',
    'Privacy Policy',
    '## Privacy Policy & Data Protection

At Nexus, your privacy is fundamental. We enforce bank-level AES-256 encryption and adhere strictly to GDPR and CCPA standards.

- **Data We Collect:** Account credentials, shipping addresses, and purchase history.
- **No Data Brokering:** We never sell, monetize, or disclose your personal information to third-party data brokers.
- **Your Rights:** You may request complete erasure of your account and personal records at any time.',
    'Privacy & Data Protection Policy — Nexus',
    'Learn how Nexus protects, encrypts, and handles your personal account and payment data.',
    true
  ),
  (
    'fb000000-0000-4000-8000-000000000005',
    'contact',
    'Contact Us',
    '## Get in Touch with Nexus Support

We are here to assist you 24 hours a day, 7 days a week.

- **Customer Care Email:** support@nexus-store.io
- **Press & Partnerships:** press@nexus-store.io
- **Headquarters:** 1200 Market Street, Suite 800, San Francisco, CA 94102',
    'Contact Nexus — 24/7 Hardware Support',
    'Get in touch with the Nexus engineering and customer support team for order inquiries and technical assistance.',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  is_published = EXCLUDED.is_published;

