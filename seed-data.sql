-- =============================================
-- MotoRoute - Seed Data
-- Supabase SQL Editor'da çalıştırın
-- Şifre tüm kullanıcılar için: Demo1234!
-- =============================================

DO $$
DECLARE
  -- User UUIDs
  u1  UUID := 'a1000000-0000-0000-0000-000000000001';
  u2  UUID := 'a2000000-0000-0000-0000-000000000002';
  u3  UUID := 'a3000000-0000-0000-0000-000000000003';
  u4  UUID := 'a4000000-0000-0000-0000-000000000004';
  u5  UUID := 'a5000000-0000-0000-0000-000000000005';
  u6  UUID := 'a6000000-0000-0000-0000-000000000006';
  u7  UUID := 'a7000000-0000-0000-0000-000000000007';
  u8  UUID := 'a8000000-0000-0000-0000-000000000008';
  u9  UUID := 'a9000000-0000-0000-0000-000000000009';
  u10 UUID := 'a0000000-0000-0000-0000-000000000010';

  -- Route UUIDs (pre-assigned)
  r1  UUID := 'b1000000-0000-0000-0000-000000000001';
  r2  UUID := 'b2000000-0000-0000-0000-000000000002';
  r3  UUID := 'b3000000-0000-0000-0000-000000000003';
  r4  UUID := 'b4000000-0000-0000-0000-000000000004';
  r5  UUID := 'b5000000-0000-0000-0000-000000000005';
  r6  UUID := 'b6000000-0000-0000-0000-000000000006';
  r7  UUID := 'b7000000-0000-0000-0000-000000000007';
  r8  UUID := 'b8000000-0000-0000-0000-000000000008';
  r9  UUID := 'b9000000-0000-0000-0000-000000000009';
  r10 UUID := 'b0000000-0000-0000-0000-000000000010';
  r11 UUID := 'b0000000-0000-0000-0000-000000000011';
  r12 UUID := 'b0000000-0000-0000-0000-000000000012';
  r13 UUID := 'b0000000-0000-0000-0000-000000000013';
  r14 UUID := 'b0000000-0000-0000-0000-000000000014';
  r15 UUID := 'b0000000-0000-0000-0000-000000000015';

  -- Club UUIDs (pre-assigned)
  c1  UUID := 'c1000000-0000-0000-0000-000000000001';
  c2  UUID := 'c2000000-0000-0000-0000-000000000002';
  c3  UUID := 'c3000000-0000-0000-0000-000000000003';
  c4  UUID := 'c4000000-0000-0000-0000-000000000004';
  c5  UUID := 'c5000000-0000-0000-0000-000000000005';
  c6  UUID := 'c6000000-0000-0000-0000-000000000006';

  -- Event UUIDs (pre-assigned)
  e1  UUID := 'd1000000-0000-0000-0000-000000000001';
  e2  UUID := 'd2000000-0000-0000-0000-000000000002';
  e3  UUID := 'd3000000-0000-0000-0000-000000000003';
  e4  UUID := 'd4000000-0000-0000-0000-000000000004';
  e5  UUID := 'd5000000-0000-0000-0000-000000000005';
  e6  UUID := 'd6000000-0000-0000-0000-000000000006';
  e7  UUID := 'd7000000-0000-0000-0000-000000000007';
  e8  UUID := 'd8000000-0000-0000-0000-000000000008';
  e9  UUID := 'd9000000-0000-0000-0000-000000000009';
  e10 UUID := 'd0000000-0000-0000-0000-000000000010';

  enc_pass TEXT;
BEGIN

-- =============================================
-- 1. AUTH USERS
-- =============================================
enc_pass := crypt('Demo1234!', gen_salt('bf'));

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES
  (u1,  '00000000-0000-0000-0000-000000000000', 'ahmet.yilmaz@demo.com',  enc_pass, NOW(), NOW()-interval'180 days', NOW(), '{"username":"seed_ahmet","full_name":"Ahmet Yılmaz"}',  'authenticated', 'authenticated', '', '', '', ''),
  (u2,  '00000000-0000-0000-0000-000000000000', 'fatma.kaya@demo.com',    enc_pass, NOW(), NOW()-interval'160 days', NOW(), '{"username":"seed_fatma","full_name":"Fatma Kaya"}',    'authenticated', 'authenticated', '', '', '', ''),
  (u3,  '00000000-0000-0000-0000-000000000000', 'mehmet.demir@demo.com',  enc_pass, NOW(), NOW()-interval'140 days', NOW(), '{"username":"seed_mehmet","full_name":"Mehmet Demir"}', 'authenticated', 'authenticated', '', '', '', ''),
  (u4,  '00000000-0000-0000-0000-000000000000', 'zeynep.celik@demo.com',  enc_pass, NOW(), NOW()-interval'120 days', NOW(), '{"username":"seed_zeynep","full_name":"Zeynep Çelik"}', 'authenticated', 'authenticated', '', '', '', ''),
  (u5,  '00000000-0000-0000-0000-000000000000', 'ali.ozturk@demo.com',    enc_pass, NOW(), NOW()-interval'100 days', NOW(), '{"username":"seed_ali","full_name":"Ali Öztürk"}',      'authenticated', 'authenticated', '', '', '', ''),
  (u6,  '00000000-0000-0000-0000-000000000000', 'ayse.sahin@demo.com',    enc_pass, NOW(), NOW()-interval'90 days',  NOW(), '{"username":"seed_ayse","full_name":"Ayşe Şahin"}',    'authenticated', 'authenticated', '', '', '', ''),
  (u7,  '00000000-0000-0000-0000-000000000000', 'murat.aydin@demo.com',   enc_pass, NOW(), NOW()-interval'80 days',  NOW(), '{"username":"seed_murat","full_name":"Murat Aydın"}',   'authenticated', 'authenticated', '', '', '', ''),
  (u8,  '00000000-0000-0000-0000-000000000000', 'selin.yildiz@demo.com',  enc_pass, NOW(), NOW()-interval'70 days',  NOW(), '{"username":"seed_selin","full_name":"Selin Yıldız"}',  'authenticated', 'authenticated', '', '', '', ''),
  (u9,  '00000000-0000-0000-0000-000000000000', 'kemal.arslan@demo.com',  enc_pass, NOW(), NOW()-interval'60 days',  NOW(), '{"username":"seed_kemal","full_name":"Kemal Arslan"}',  'authenticated', 'authenticated', '', '', '', ''),
  (u10, '00000000-0000-0000-0000-000000000000', 'derya.erdogan@demo.com', enc_pass, NOW(), NOW()-interval'45 days',  NOW(), '{"username":"seed_derya","full_name":"Derya Erdoğan"}', 'authenticated', 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. PROFILES
-- =============================================
INSERT INTO public.profiles (id, username, full_name, bio, location, vehicle_type, total_km, total_rides, avg_speed, follower_count, following_count, created_at)
VALUES
  (u1,  'seed_ahmet',  'Ahmet Yılmaz',  'Karadeniz yollarının âşığı. 15 yıldır motosiklet sürüyorum. Bolu, Abant ve sahil rotaları favorim.',                          'İstanbul',  'motorcycle', 42800, 312, 78.5, 847,  234,  NOW()-interval'180 days'),
  (u2,  'seed_fatma',  'Fatma Kaya',    'Ege sahillerini bisikletle ve motorla keşfediyorum. Doğa fotoğrafçısı, macera tutkunuyum.',                                    'İzmir',     'both',       18600, 198, 62.3, 512,  189,  NOW()-interval'160 days'),
  (u3,  'seed_mehmet', 'Mehmet Demir',  'Off-road uzmanı. Türkiye''nin her köşesini aştım. Kapadokya''dan Kaz Dağları''na kadar her yolu biliyorum.',                  'Ankara',    'motorcycle', 67400, 521, 82.1, 1240, 345,  NOW()-interval'140 days'),
  (u4,  'seed_zeynep', 'Zeynep Çelik',  'Şehir bisikletçisi ve yol sürücüsü. Alaçatı bisiklet festivalinin düzenleyicisi. İklim dostu ulaşım savunucusu.',             'İzmir',     'bicycle',    9800,  156, 28.4, 423,  267,  NOW()-interval'120 days'),
  (u5,  'seed_ali',    'Ali Öztürk',    'Bursa''dan tüm Türkiye''ye tur yapan gezgin. Uludağ eteklerinde hafta sonu sürüşleri organize ediyorum.',                      'Bursa',     'motorcycle', 38200, 287, 74.6, 634,  198,  NOW()-interval'100 days'),
  (u6,  'seed_ayse',   'Ayşe Şahin',    'Antalya''nın masmavi denizi ve dağlarını bisikletle keşfediyorum. Toros eteklerinde antrenman yapıyorum.',                     'Antalya',   'bicycle',    12400, 203, 31.2, 389,  156,  NOW()-interval'90 days'),
  (u7,  'seed_murat',  'Murat Aydın',   'Karadeniz''in efsanevi yollarında 10 yıldır motor sürüyorum. Trabzon-Artvin güzergahı benim için kutsal rota.',                'Trabzon',   'motorcycle', 53700, 418, 79.8, 921,  312,  NOW()-interval'80 days'),
  (u8,  'seed_selin',  'Selin Yıldız',  'Eskişehir''den başladım, tüm Anadolu''yu gezdim. Hem motor hem bisikletle uzun mesafe turları yapıyorum.',                     'Eskişehir', 'both',       24100, 234, 58.9, 478,  223,  NOW()-interval'70 days'),
  (u9,  'seed_kemal',  'Kemal Arslan',  'Konya ovalarından Toroslar''a uzanan rotaların keşfedicisi. Vintage motosiklet koleksiyoncusu ve topluluk kurucusu.',           'Konya',     'motorcycle', 31500, 261, 71.3, 567,  178,  NOW()-interval'60 days'),
  (u10, 'seed_derya',  'Derya Erdoğan', 'Bodrum yarımadası ve Ege adaları turu uzmanı. Denizle buluşan yolları severim. Bisiklet ve motor dengesi.',                   'Bodrum',    'both',       15800, 187, 45.7, 334,  145,  NOW()-interval'45 days')
ON CONFLICT (id) DO UPDATE SET
  username        = EXCLUDED.username,
  full_name       = EXCLUDED.full_name,
  bio             = EXCLUDED.bio,
  location        = EXCLUDED.location,
  vehicle_type    = EXCLUDED.vehicle_type,
  total_km        = EXCLUDED.total_km,
  total_rides     = EXCLUDED.total_rides,
  avg_speed       = EXCLUDED.avg_speed,
  follower_count  = EXCLUDED.follower_count,
  following_count = EXCLUDED.following_count;

-- =============================================
-- 3. ROUTES
-- =============================================
INSERT INTO public.routes (id, user_id, title, description, distance, elevation_gain, difficulty, road_type, vehicle_type, is_public, tags, rating_avg, rating_count, view_count, save_count, waypoints, created_at)
VALUES

(r1, u7, 'Karadeniz Sahil Yolu — Trabzon''dan Rize''ye',
 'Türkiye''nin en görkemli sahil rotalarından biri. Karadeniz''in mavisiyle yeşilin buluştuğu bu rota, Trabzon''dan Rize''ye muhteşem manzaralar sunar. Yol boyunca çay bahçeleri, ormanlar ve tarihi köprüler.',
 187.5, 2840, 'hard', 'asphalt', 'motorcycle', true,
 ARRAY['karadeniz','sahil','manzara','çay bahçeleri','tarihi'], 4.8, 47, 1234, 89,
 '[[41.0028,39.7168,12],[41.0156,39.8234,45],[41.0312,39.9187,120],[41.0478,39.9823,280],[41.0634,40.0512,450],[41.0789,40.1234,620],[41.0912,40.2156,780],[41.1045,40.2978,920],[41.1089,40.4123,890],[41.0934,40.4634,650],[41.0612,40.5723,180],[41.0512,40.6089,95]]'::jsonb,
 NOW()-interval'120 days'),

(r2, u1, 'Bolu Dağı Panorama Rotası',
 'İstanbul''dan çıkarak Bolu Dağı''nı aşan klasik rota. Dağın zirvesinden görülen manzara eşsizdir. Abant Gölü molayla tamamlanır.',
 245.0, 3200, 'medium', 'asphalt', 'motorcycle', true,
 ARRAY['bolu','dağ','panorama','abant','istanbul'], 4.6, 83, 2341, 156,
 '[[41.0082,28.9784,50],[40.9456,29.3012,420],[40.8912,29.6234,950],[40.8534,29.8634,1320],[40.7923,30.0312,1620],[40.7412,30.2712,2080],[40.7234,30.3623,1950],[40.7234,31.5823,750]]'::jsonb,
 NOW()-interval'95 days'),

(r3, u2, 'Ege Sahil Turu — İzmir''den Çeşme''ye',
 'Ege''nin turkuaz koylarını, zeytinlikleri ve antik harabeleri boyunca uzanan bu rota hem motosikletçiler hem bisikletçiler için mükemmel. Alaçatı''da taş ev kahvaltısı şart!',
 156.0, 1240, 'easy', 'asphalt', 'both', true,
 ARRAY['ege','sahil','çeşme','alaçatı','deniz','zeytin'], 4.7, 62, 1876, 134,
 '[[38.4192,27.1287,45],[38.3512,26.8234,180],[38.2923,26.6012,310],[38.2012,26.3512,210],[38.1423,26.2234,90],[38.0712,26.1623,35],[38.0423,26.1234,18]]'::jsonb,
 NOW()-interval'88 days'),

(r4, u3, 'Kapadokya Peri Bacaları Turu',
 'Dünyanın 8. harikası Kapadokya''nın peri bacaları, yeraltı şehirleri ve üzüm bağları arasında unutulmaz rota. Güvercinlik Vadisi''nden Derinkuyu''ya uzanan tarihi güzergah.',
 312.0, 2100, 'medium', 'mixed', 'motorcycle', true,
 ARRAY['kapadokya','peri bacaları','tarihi','nevşehir','balon'], 4.9, 124, 4521, 287,
 '[[38.6431,34.8289,1050],[38.6923,34.9234,1080],[38.7312,35.0123,1090],[38.6512,35.0834,1050],[38.5423,34.9612,1080],[38.4923,34.9012,1120],[38.4512,34.8612,1060]]'::jsonb,
 NOW()-interval'76 days'),

(r5, u7, 'Artvin — Tortum Şelalesi Güzergahı',
 'Artvin''in efsanevi dağ yollarında ilerlenerek ulaşılan Tortum Şelalesi rotası. Boğaz köprüsünden yükseklere tırmanarak vadilerin tadını çıkarın. Uzman sürücüler için zorlu ama ödüllendirici.',
 198.0, 4800, 'expert', 'mixed', 'motorcycle', true,
 ARRAY['artvin','tortum','şelale','dağ','off-road','nehir'], 4.7, 38, 987, 67,
 '[[41.1823,41.8134,180],[41.2412,41.9312,780],[41.3012,42.0512,1580],[41.3412,42.1234,2050],[41.3023,42.1923,1750],[41.2423,42.2723,1050],[41.2234,42.2934,820]]'::jsonb,
 NOW()-interval'64 days'),

(r6, u4, 'Alaçatı Taş Sokaklarda Bisiklet Turu',
 'Alaçatı''nın tarihi taş sokakları, rüzgar gülü tarlalarını ve bağ evlerini kapsayan bisiklet parkuru. Sabah erken çıkın, öğlen cunda''da öğle yemeği.',
 48.5, 380, 'easy', 'asphalt', 'bicycle', true,
 ARRAY['alaçatı','bisiklet','tarihi','rüzgar','sörf','ege'], 4.5, 56, 1234, 98,
 '[[38.2823,26.3712,45],[38.3112,26.3134,55],[38.3423,26.2534,72],[38.3712,26.1934,52],[38.3912,26.1512,45],[38.3812,26.2512,55],[38.3712,26.3012,48]]'::jsonb,
 NOW()-interval'55 days'),

(r7, u5, 'Sapanca Gölü Çevre Yolu',
 'Sapanca Gölü''nü çevreleyen rota hem aileler hem deneyimli sürücüler için ideal. Gölün her iki yanından geçen yollar farklı manzaralar sunar. Sonbaharda renk renk yapraklar arasında sürüş şöleni.',
 124.0, 1560, 'medium', 'asphalt', 'both', true,
 ARRAY['sapanca','göl','orman','doğa','hafta sonu'], 4.4, 71, 1567, 112,
 '[[40.7023,30.2534,65],[40.6712,30.4012,240],[40.6412,30.5312,420],[40.6212,30.6012,320],[40.6512,30.6923,160],[40.6912,30.7512,90],[40.7123,30.7612,70]]'::jsonb,
 NOW()-interval'48 days'),

(r8, u8, 'Pamukkale''den Efes''e Tarihi Güzergah',
 'UNESCO Dünya Mirası listesindeki iki dev arasında uzanan tarihi güzergah. Beyaz travertenlerden antik tiyatroya yolculuk.',
 287.0, 1890, 'medium', 'asphalt', 'motorcycle', true,
 ARRAY['pamukkale','efes','tarihi','unesco','antik','tur'], 4.8, 93, 3456, 234,
 '[[37.9212,29.1234,350],[38.0512,28.8312,440],[38.2512,28.4634,330],[38.3834,28.2234,240],[38.4123,28.1034,180],[38.4192,27.1287,45]]'::jsonb,
 NOW()-interval'42 days'),

(r9, u3, 'Kaz Dağları Doğa & Off-Road Rotası',
 'İda Dağı olarak da bilinen Kaz Dağları, Türkiye''nin en zengin ekosistemlerinden birine ev sahipliği yapar. Off-road güzergahlar ve ormanlık yollarla dolu bu rota doğa tutkunları için yapılmış.',
 178.0, 3400, 'hard', 'offroad', 'motorcycle', true,
 ARRAY['kaz dağları','off-road','doğa','çanakkale','orman','trek'], 4.6, 44, 876, 78,
 '[[39.7123,26.8234,180],[39.7712,26.9412,720],[39.8312,27.0612,1320],[39.8712,27.1034,1680],[39.9012,27.1434,1940],[39.9012,27.1834,1580],[39.8612,27.2234,1100]]'::jsonb,
 NOW()-interval'38 days'),

(r10, u6, 'Erciyes Eteklerinde Dağ Bisikleti',
 'Kayseri''nin simgesi Erciyes Dağı eteklerinde zorlu dağ bisikleti rotası. 3916 metreye yükselen bu volkanik dağın yamacında pedal çevirmek unutulmaz bir deneyim.',
 89.0, 2800, 'expert', 'offroad', 'bicycle', true,
 ARRAY['erciyes','dağ bisikleti','kayseri','volkanik','zorlu'], 4.7, 29, 654, 45,
 '[[38.5234,35.4512,1050],[38.6012,35.5312,1740],[38.6812,35.6112,2450],[38.7212,35.6512,2780],[38.7512,35.7112,3180],[38.7612,35.7312,3320]]'::jsonb,
 NOW()-interval'31 days'),

(r11, u9, 'Safranbolu Osmanlı Mirası Güzergahı',
 'Osmanlı döneminden kalma tarihi evleri ve çarşısıyla UNESCO listesindeki Safranbolu''ya götüren rota. Safran tarlalarının arasından geçen yolda tarihe bir yolculuk.',
 156.0, 1200, 'easy', 'asphalt', 'both', true,
 ARRAY['safranbolu','osmanlı','tarihi','safran','karabük','keşif'], 4.5, 67, 1876, 123,
 '[[41.2534,32.6934,350],[41.2834,32.6134,400],[41.2534,32.4534,370],[41.2034,32.2934,295],[41.1734,32.1712,250]]'::jsonb,
 NOW()-interval'25 days'),

(r12, u10, 'Muğla Orman Yolları — Datça Yarımadası',
 'Datça yarımadasının uç noktasına uzanan bu rota, çam ormanları, koy ve antik kent kalıntılarıyla doludur. Knidos''ta iki denizin buluştuğu manzarayla ödüllendirilirsiniz.',
 134.0, 1680, 'hard', 'mixed', 'both', true,
 ARRAY['muğla','datça','yarımada','orman','knidos','antik'], 4.8, 35, 789, 67,
 '[[36.8512,27.9234,85],[36.7512,27.6234,310],[36.6512,27.3234,300],[36.5912,27.1434,180],[36.5834,27.0834,120]]'::jsonb,
 NOW()-interval'19 days'),

(r13, u5, 'Çanakkale — Gelibolu Tarih Yolu',
 '1. Dünya Savaşı''nın izlerini taşıyan Gelibolu yarımadasını boydan boya kat eden anlamlı rota. Anafartalar sırtlarından Seddülbahir''e kadar her adım tarihin içinde.',
 178.0, 980, 'easy', 'asphalt', 'both', true,
 ARRAY['çanakkale','gelibolu','tarihi','1.dünya savaşı','anıtkabir'], 4.9, 89, 2345, 178,
 '[[40.1534,26.4012,45],[40.0734,26.2412,160],[39.9534,26.0012,60],[39.8934,25.8812,40],[39.8734,25.8412,35]]'::jsonb,
 NOW()-interval'14 days'),

(r14, u2, 'Bozcaada Bağ Yolları Turu',
 'Ege''nin sakin adası Bozcaada''nın üzüm bağları, zeytinlikleri ve deniz manzarasıyla dolu mini turu. Ferry ile geçip adayı keşfetmek için mükemmel bir günlük rota.',
 38.0, 420, 'easy', 'asphalt', 'bicycle', true,
 ARRAY['bozcaada','ada','bağ','ege','şarap','bisiklet'], 4.6, 48, 1123, 87,
 '[[39.8323,26.0634,12],[39.8712,26.0212,68],[39.9012,25.9912,108],[39.9012,25.9612,102],[39.8612,25.9212,45]]'::jsonb,
 NOW()-interval'10 days'),

(r15, u6, 'Antalya — Toroslar''da Bisiklet Macerası',
 'Akdeniz kıyısından Toros Dağları''na tırmanan bu bisiklet rotası, deniz seviyesinden 1800 metreye çıkarak Türkiye''nin en etkileyici manzaralarını sunar. Köprülü Kanyon üzerinden.',
 142.0, 3200, 'expert', 'mixed', 'bicycle', true,
 ARRAY['antalya','toroslar','bisiklet','köprülü kanyon','dağ','zorlu'], 4.8, 31, 678, 54,
 '[[36.8969,30.7133,5],[36.9812,30.8123,320],[37.0712,30.9012,920],[37.1612,30.9912,1520],[37.2212,31.0512,1780],[37.2512,31.0812,1850],[37.2012,31.1212,1650]]'::jsonb,
 NOW()-interval'6 days')

ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. CLUBS
-- =============================================
INSERT INTO public.clubs (id, name, description, owner_id, member_count, vehicle_type, location, is_public, join_type, created_at)
VALUES
  (c1, 'İstanbul Moto Kulübü',         'İstanbul ve çevresi motosiklet tutkunlarının buluşma noktası. Her hafta sonu organize tur, yılda 2 büyük konvoy etkinliği.',               u1, 0, 'motorcycle', 'İstanbul',  true, 'open',     NOW()-interval'150 days'),
  (c2, 'Karadeniz Riders',             'Karadeniz sahilini ve dağlarını keşfeden deneyimli sürücüler topluluğu. Trabzon merkezli, tüm Karadeniz sahiline düzenli turlar.',         u7, 0, 'motorcycle', 'Trabzon',   true, 'open',     NOW()-interval'130 days'),
  (c3, 'Ege Bisiklet Derneği',         'İzmir ve Ege adaları bisikletçilerinin platformu. Haftalık grup sürüşleri, spordan trekking''e her seviyede etkinlik.',                   u4, 0, 'bicycle',    'İzmir',     true, 'open',     NOW()-interval'110 days'),
  (c4, 'Türkiye Off-Road Club',        'Türkiye''nin dört bir yanındaki off-road ve enduro sürücülerini bir araya getiren kulüp. Zorlu rotalar, kamp geceleri.',                  u3, 0, 'motorcycle', 'Ankara',    true, 'approval', NOW()-interval'90 days'),
  (c5, 'Anadolu Touring',              'Uzun mesafe tur ve keşif gezileri düzenleyen deneyimli sürücüler topluluğu. Yılda 2 uluslararası tur.',                                   u8, 0, 'both',       'Eskişehir', true, 'open',     NOW()-interval'70 days'),
  (c6, 'Akdeniz Sahil Bisikletçileri', 'Antalya ve Akdeniz kıyılarında bisiklet sürüşleri düzenleyen aktif topluluk. Sabah erken sürüşleri ve haftalık buluşmalar.',              u6, 0, 'bicycle',    'Antalya',   true, 'open',     NOW()-interval'50 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. CLUB MEMBERS
-- =============================================
INSERT INTO public.club_members (club_id, user_id, role, status, joined_at)
VALUES
  (c1, u1,  'admin',     'active', NOW()-interval'150 days'),
  (c1, u2,  'moderator', 'active', NOW()-interval'140 days'),
  (c1, u5,  'member',    'active', NOW()-interval'120 days'),
  (c1, u8,  'member',    'active', NOW()-interval'100 days'),
  (c1, u9,  'member',    'active', NOW()-interval'80 days'),
  (c1, u10, 'member',    'active', NOW()-interval'60 days'),
  (c2, u7,  'admin',     'active', NOW()-interval'130 days'),
  (c2, u1,  'moderator', 'active', NOW()-interval'120 days'),
  (c2, u3,  'member',    'active', NOW()-interval'100 days'),
  (c2, u9,  'member',    'active', NOW()-interval'75 days'),
  (c3, u4,  'admin',     'active', NOW()-interval'110 days'),
  (c3, u2,  'moderator', 'active', NOW()-interval'100 days'),
  (c3, u6,  'member',    'active', NOW()-interval'85 days'),
  (c3, u10, 'member',    'active', NOW()-interval'65 days'),
  (c4, u3,  'admin',     'active', NOW()-interval'90 days'),
  (c4, u7,  'moderator', 'active', NOW()-interval'80 days'),
  (c4, u5,  'member',    'active', NOW()-interval'70 days'),
  (c4, u8,  'member',    'active', NOW()-interval'55 days'),
  (c5, u8,  'admin',     'active', NOW()-interval'70 days'),
  (c5, u1,  'member',    'active', NOW()-interval'60 days'),
  (c5, u3,  'member',    'active', NOW()-interval'50 days'),
  (c5, u9,  'member',    'active', NOW()-interval'40 days'),
  (c6, u6,  'admin',     'active', NOW()-interval'50 days'),
  (c6, u4,  'member',    'active', NOW()-interval'40 days'),
  (c6, u2,  'member',    'active', NOW()-interval'30 days'),
  (c6, u10, 'member',    'active', NOW()-interval'20 days')
ON CONFLICT (club_id, user_id) DO NOTHING;

-- =============================================
-- 6. EVENTS
-- =============================================
INSERT INTO public.events (id, title, description, date, end_date, location_name, location_lat, location_lng, club_id, created_by, max_participants, participant_count, difficulty, vehicle_type, is_public, required_equipment, created_at)
VALUES
  (e1,  'Karadeniz Sahil Konvoyu 2026',
   'Trabzon''dan Rize''ye düzenlenecek dev konvoy etkinliği. 200+ motosikletçiyle unutulmaz bir Karadeniz turu. Sabah 08:00''de Trabzon Merkez''den hareket.',
   NOW()+interval'8 days', NOW()+interval'9 days', 'Trabzon Meydan, Trabzon', 41.0028, 39.7168,
   c2, u7, 250, 0, 'medium', 'motorcycle', true, ARRAY['kask','yağmurluk','ilk yardım seti'], NOW()-interval'20 days'),

  (e2,  'İstanbul Bisiklet Festivali',
   'Her yıl geleneksel hale gelen İstanbul Bisiklet Festivali bu yıl da Belgrad Ormanı''nda. Farklı parkurlar, müzik ve doğa şöleni.',
   NOW()+interval'15 days', NOW()+interval'15 days', 'Belgrad Ormanı, İstanbul', 41.1823, 28.9823,
   c1, u1, 500, 0, 'easy', 'bicycle', true, ARRAY['bisiklet','kask','su'], NOW()-interval'18 days'),

  (e3,  'Ege Off-Road Kupası',
   'İzmir Kemalpaşa''da düzenlenecek off-road yarışı ve şenliği. Hem profesyonel hem amatör kategoriler var. Ödül töreni akşam saat 18:00.',
   NOW()+interval'22 days', NOW()+interval'23 days', 'Kemalpaşa, İzmir', 38.4323, 27.4012,
   c3, u3, 150, 0, 'hard', 'motorcycle', true, ARRAY['off-road kask','koruyucu ekipman','enduro lastik'], NOW()-interval'15 days'),

  (e4,  'Kapadokya Gün Batımı Turu',
   'Peri bacaları arasında gün batımı sürüşü. Balon uçuşuyla birleştirilebilen özel güzergah. Göreme''den başlayıp Uçhisar kalesinde son bulur.',
   NOW()+interval'12 days', NOW()+interval'12 days', 'Göreme, Nevşehir', 38.6431, 34.8289,
   null, u3, 40, 0, 'medium', 'motorcycle', true, ARRAY['fotoğraf makinesi','kask','yağmurluk'], NOW()-interval'12 days'),

  (e5,  'Bursa Uludağ Tırmanış Turu',
   'Uludağ''ın zirvesine motor konvoyuyla tırmanış. Orman yollarından kar sınırına kadar uzanan bu tur hafif off-road tecrübesi gerektirir.',
   NOW()+interval'30 days', NOW()+interval'30 days', 'Uludağ Kapısı, Bursa', 40.1072, 29.1234,
   c1, u5, 60, 0, 'hard', 'motorcycle', true, ARRAY['kış lastiği','kask','sıcak kıyafet'], NOW()-interval'10 days'),

  (e6,  'Bodrum Gece Sürüşü',
   'Bodrum yarımadasının güzel köylerini gece yarısı serinliğinde keşfeden özel tur. Gündönümü tepesinden sabah karşılama programı.',
   NOW()+interval'5 days', NOW()+interval'6 days', 'Bodrum Kalesi, Bodrum', 37.0334, 27.4234,
   null, u10, 30, 0, 'easy', 'both', true, ARRAY['reflektör','ışık sistemi','powerbank'], NOW()-interval'8 days'),

  (e7,  'Antalya Toros Bisiklet Maratonu',
   'Denizden dağa 142 km''lik maratonu tamamlamak için kaydolun. Köprülü Kanyon üzerinden geçen bu rota Türkiye''nin en zorlu bisiklet etkinliği.',
   NOW()+interval'45 days', NOW()+interval'45 days', 'Antalya Bisiklet Kulübü, Antalya', 36.8969, 30.7133,
   c6, u6, 200, 0, 'expert', 'bicycle', true, ARRAY['dağ bisikleti','kask','yedek lastik','enerji barı','gps'], NOW()-interval'6 days'),

  (e8,  'Ankara Vintage Moto Show',
   'Türkiye''nin en büyük vintage motosiklet fuarı ve gösterisi. 1950''lerden günümüze efsane makineler. Sergi, yarışma ve açık arttırma.',
   NOW()+interval'35 days', NOW()+interval'36 days', 'ATO Kongre Merkezi, Ankara', 39.9198, 32.8543,
   null, u9, 1000, 0, 'easy', 'motorcycle', true, ARRAY['katılım ücreti gerekli'], NOW()-interval'4 days'),

  (e9,  'Marmara Turu — Tam Çevre',
   'Marmara Denizi''ni tam çevre olarak kat eden 3 günlük muhteşem tur. Her gece farklı bir şehirde konaklama, toplam 680 km.',
   NOW()+interval'60 days', NOW()+interval'62 days', 'Haydarpaşa İskelesi, İstanbul', 40.9998, 29.0178,
   c5, u8, 50, 0, 'medium', 'motorcycle', true, ARRAY['çadır veya rezervasyon','suluk','yağmurluk','kask'], NOW()-interval'3 days'),

  (e10, 'Safranbolu Tarihi Keşif Turu',
   'Safranbolu''nun UNESCO mirası tarihi dokusunu motosiklet ve bisikletle keşfetmek için özel rehberli tur. Osmanlı hanlarında konaklama imkanı.',
   NOW()+interval'18 days', NOW()+interval'19 days', 'Safranbolu Hanı, Karabük', 41.2534, 32.6934,
   null, u9, 35, 0, 'easy', 'both', true, ARRAY['kask','fotoğraf makinesi'], NOW()-interval'2 days')

ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. EVENT PARTICIPANTS
-- =============================================
INSERT INTO public.event_participants (event_id, user_id, status, created_at)
VALUES
  (e1, u7,  'going', NOW()-interval'15 days'),
  (e1, u1,  'going', NOW()-interval'14 days'),
  (e1, u3,  'going', NOW()-interval'12 days'),
  (e1, u5,  'maybe', NOW()-interval'10 days'),
  (e1, u9,  'going', NOW()-interval'8 days'),
  (e2, u1,  'going', NOW()-interval'12 days'),
  (e2, u4,  'going', NOW()-interval'11 days'),
  (e2, u6,  'going', NOW()-interval'9 days'),
  (e2, u10, 'maybe', NOW()-interval'7 days'),
  (e2, u2,  'going', NOW()-interval'5 days'),
  (e3, u3,  'going', NOW()-interval'10 days'),
  (e3, u7,  'going', NOW()-interval'9 days'),
  (e3, u5,  'going', NOW()-interval'7 days'),
  (e4, u3,  'going', NOW()-interval'8 days'),
  (e4, u8,  'going', NOW()-interval'7 days'),
  (e4, u2,  'maybe', NOW()-interval'5 days'),
  (e5, u5,  'going', NOW()-interval'7 days'),
  (e5, u1,  'going', NOW()-interval'6 days'),
  (e5, u9,  'maybe', NOW()-interval'4 days'),
  (e6, u10, 'going', NOW()-interval'5 days'),
  (e6, u2,  'going', NOW()-interval'4 days'),
  (e7, u6,  'going', NOW()-interval'4 days'),
  (e7, u4,  'going', NOW()-interval'3 days'),
  (e8, u9,  'going', NOW()-interval'2 days'),
  (e8, u3,  'maybe', NOW()-interval'2 days'),
  (e9, u8,  'going', NOW()-interval'2 days'),
  (e9, u1,  'going', NOW()-interval'1 days'),
  (e10,u9,  'going', NOW()-interval'1 days'),
  (e10,u5,  'going', NOW()-interval'1 days')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- =============================================
-- 8. ROUTE REVIEWS
-- =============================================
INSERT INTO public.route_reviews (route_id, user_id, rating, comment, created_at)
VALUES
  (r1, u1, 5, 'Karadeniz''in en güzel rotalarından biri. Gözlerinize inanamamıyorsunuz. Kesinlikle tavsiye ederim!', NOW()-interval'100 days'),
  (r1, u3, 5, 'Efsane bir rota. Çay bahçelerinin içinden geçmek ayrı bir duygu. Trabzon''a gidince mutlaka.',        NOW()-interval'90 days'),
  (r1, u5, 4, 'Güzel ama bazı virajlar tehlikeli. Yağmurlu havalarda dikkatli olun.',                                 NOW()-interval'75 days'),
  (r2, u7, 5, 'Bolu Dağı her mevsim farklı güzel. Sonbaharda yaprak renklerinde nefes kesici.',                      NOW()-interval'85 days'),
  (r2, u4, 4, 'Yoğun saatlerde İstanbul çıkışı zor ama rota harika.',                                                NOW()-interval'70 days'),
  (r2, u9, 5, 'Klasikleşmiş Türk motor rotası. Her sürücünün bir kez yapması gerek.',                                NOW()-interval'55 days'),
  (r3, u3, 5, 'Ege''nin turkuaz suları her adımda yanınızda. Alaçatı durağını kaçırmayın.',                          NOW()-interval'75 days'),
  (r3, u9, 4, 'Hafif rüzgarlı günlerde mükemmel. Yazın çok kalabalık olabiliyor.',                                   NOW()-interval'60 days'),
  (r4, u1, 5, 'Kapadokya''yı motor sırtında gezmek çok farklı bir deneyim. Balon turunu da ekleyin.',               NOW()-interval'65 days'),
  (r4, u6, 5, 'Peri bacaları arasında motorla gidebilmek inanılmaz. Gün batımı muhteşem.',                           NOW()-interval'50 days'),
  (r4, u10,5, 'Türkiye''nin en fotojenik rotası bu olmalı. Fotoğrafçılar için cennet.',                              NOW()-interval'40 days'),
  (r5, u1, 4, 'Çok zorlu ama ödülü büyük. Tortum Şelalesi''ni görmek için her şeye değer.',                         NOW()-interval'55 days'),
  (r7, u3, 4, 'Hafta sonları ideal. Göl manzarası ve orman harika.',                                                  NOW()-interval'40 days'),
  (r7, u6, 5, 'Ailece gidebileceğiniz, başlangıç seviyesi için mükemmel rota.',                                       NOW()-interval'30 days'),
  (r8, u2, 5, 'İki UNESCO alanını aynı rotada görmek harika. Rehbersiz de rahat gezilebilir.',                       NOW()-interval'35 days'),
  (r9, u5, 5, 'Off-road tutkunları için cennet. Kaz Dağları''nın havası başka.',                                     NOW()-interval'30 days'),
  (r11,u2, 4, 'Tarihin içinde bir tur. Safran kokusunu unutamıyorum.',                                                NOW()-interval'20 days'),
  (r13,u7, 5, 'Her Türk''ün yapması gereken tarihi bir rota. Çok duygulanacaksınız.',                                NOW()-interval'12 days'),
  (r14,u3, 4, 'Bozcaada''nın sakinliği başka. Kalabalık sezonu kaçırın.',                                            NOW()-interval'8 days')
ON CONFLICT (route_id, user_id) DO NOTHING;

-- =============================================
-- 9. SAVED ROUTES
-- =============================================
INSERT INTO public.saved_routes (user_id, route_id, created_at)
VALUES
  (u1, r4,  NOW()-interval'60 days'), (u1, r5,  NOW()-interval'45 days'), (u1, r13, NOW()-interval'10 days'),
  (u2, r1,  NOW()-interval'80 days'), (u2, r3,  NOW()-interval'55 days'), (u2, r8,  NOW()-interval'30 days'),
  (u3, r1,  NOW()-interval'70 days'), (u3, r2,  NOW()-interval'50 days'), (u3, r15, NOW()-interval'5 days'),
  (u4, r3,  NOW()-interval'90 days'), (u4, r6,  NOW()-interval'40 days'), (u4, r14, NOW()-interval'7 days'),
  (u5, r2,  NOW()-interval'75 days'), (u5, r7,  NOW()-interval'35 days'), (u5, r13, NOW()-interval'12 days'),
  (u6, r3,  NOW()-interval'65 days'), (u6, r10, NOW()-interval'25 days'), (u6, r15, NOW()-interval'4 days'),
  (u7, r1,  NOW()-interval'55 days'), (u7, r5,  NOW()-interval'40 days'), (u7, r9,  NOW()-interval'15 days'),
  (u8, r4,  NOW()-interval'30 days'), (u8, r8,  NOW()-interval'20 days'), (u8, r11, NOW()-interval'10 days'),
  (u9, r2,  NOW()-interval'45 days'), (u9, r11, NOW()-interval'15 days'), (u9, r13, NOW()-interval'8 days'),
  (u10,r12, NOW()-interval'15 days'), (u10,r14, NOW()-interval'7 days'),  (u10,r3,  NOW()-interval'3 days')
ON CONFLICT (user_id, route_id) DO NOTHING;

-- =============================================
-- 10. FOLLOWS
-- =============================================
INSERT INTO public.follows (follower_id, following_id, created_at)
VALUES
  (u1, u7,  NOW()-interval'150 days'), (u1, u3,  NOW()-interval'140 days'), (u1, u5,  NOW()-interval'120 days'),
  (u2, u4,  NOW()-interval'130 days'), (u2, u7,  NOW()-interval'110 days'), (u2, u3,  NOW()-interval'90 days'),
  (u3, u7,  NOW()-interval'120 days'), (u3, u1,  NOW()-interval'100 days'), (u3, u9,  NOW()-interval'80 days'),
  (u4, u2,  NOW()-interval'110 days'), (u4, u6,  NOW()-interval'90 days'),  (u4, u10, NOW()-interval'70 days'),
  (u5, u1,  NOW()-interval'100 days'), (u5, u7,  NOW()-interval'80 days'),  (u5, u3,  NOW()-interval'60 days'),
  (u6, u4,  NOW()-interval'85 days'),  (u6, u2,  NOW()-interval'65 days'),  (u6, u10, NOW()-interval'45 days'),
  (u7, u1,  NOW()-interval'75 days'),  (u7, u3,  NOW()-interval'55 days'),  (u7, u9,  NOW()-interval'35 days'),
  (u8, u3,  NOW()-interval'65 days'),  (u8, u7,  NOW()-interval'45 days'),  (u8, u1,  NOW()-interval'25 days'),
  (u9, u3,  NOW()-interval'55 days'),  (u9, u7,  NOW()-interval'40 days'),  (u9, u1,  NOW()-interval'20 days'),
  (u10,u2,  NOW()-interval'40 days'),  (u10,u4,  NOW()-interval'25 days'),  (u10,u6,  NOW()-interval'10 days')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- =============================================
-- 11. SAYAÇLARI GÜNCELLE
-- =============================================
UPDATE public.clubs SET member_count = (
  SELECT COUNT(*) FROM public.club_members WHERE club_id = clubs.id AND status = 'active'
);

UPDATE public.events SET participant_count = (
  SELECT COUNT(*) FROM public.event_participants WHERE event_id = events.id AND status = 'going'
);

UPDATE public.profiles SET
  follower_count  = (SELECT COUNT(*) FROM public.follows WHERE following_id = profiles.id),
  following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id  = profiles.id);

RAISE NOTICE '✅ Seed data başarıyla eklendi!';
RAISE NOTICE 'Şifre: Demo1234! | 10 kullanıcı, 15 rota, 10 etkinlik, 6 kulüp';

END $$;
