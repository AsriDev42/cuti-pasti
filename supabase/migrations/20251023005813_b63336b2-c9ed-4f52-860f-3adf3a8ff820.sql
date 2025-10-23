-- Clear existing units
DELETE FROM public.units;

-- Insert new unit data
INSERT INTO public.units (name, code) VALUES
('Balai Besar Pelatihan Vokasi dan Produktivitas Bandung', 'BBPVP-BDG'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Bekasi', 'BBPVP-BKS'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Medan', 'BBPVP-MDN'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Makassar', 'BBPVP-MKS'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Semarang', 'BBPVP-SMG'),
('Balai Besar Pelatihan Vokasi dan Produktivitas Serang', 'BBPVP-SRG'),
('Balai Pelatihan Vokasi dan Produktivitas Banda Aceh', 'BPVP-ACH'),
('Balai Pelatihan Vokasi dan Produktivitas Ambon', 'BPVP-AMB'),
('Balai Pelatihan Vokasi dan Produktivitas Bandung Barat', 'BPVP-BBR'),
('Balai Pelatihan Vokasi dan Produktivitas Belitung', 'BPVP-BLT'),
('Balai Pelatihan Vokasi dan Produktivitas Bantaeng', 'BPVP-BTG'),
('Balai Pelatihan Vokasi dan Produktivitas Banyuwangi', 'BPVP-BWI'),
('Balai Pelatihan Vokasi dan Produktivitas Kendari', 'BPVP-KDI'),
('Balai Pelatihan Vokasi dan Produktivitas Lombok Timur', 'BPVP-LTM'),
('Balai Pelatihan Vokasi dan Produktivitas Padang', 'BPVP-PDG'),
('Balai Pelatihan Vokasi dan Produktivitas Pangkajene dan Kepulauan', 'BPVP-PKP'),
('Balai Pelatihan Vokasi dan Produktivitas Sidoarjo', 'BPVP-SDA'),
('Balai Pelatihan Vokasi dan Produktivitas Surakarta', 'BPVP-SKA'),
('Balai Pelatihan Vokasi dan Produktivitas Samarinda', 'BPVP-SMD'),
('Balai Pelatihan Vokasi dan Produktivitas Sorong', 'BPVP-SRO'),
('Balai Pelatihan Vokasi dan Produktivitas Ternate', 'BPVP-TTE'),
('Direktorat Pembinaan Instruktur dan Tenaga Pelatihan', 'DIT-PITP'),
('Direktorat Pembinaan Kelembagaan Pelatihan Vokasi', 'DIT-PKPV'),
('Direktorat Pembinaan Peningkatan Produktivitas', 'DIT-PPP'),
('Direktorat Pembinaan Penyelenggaraan Pelatihan Vokasi dan Pemagangan', 'DIT-PPPVM'),
('Direktorat Pembinaan Standarisasi Kompetensi dan Program Pelatihan', 'DIT-PSKPP'),
('Sekretariat Badan Nasional Sertifikasi Profesi', 'SEKT-BNSP'),
('Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas', 'SEKT-DITJEN');