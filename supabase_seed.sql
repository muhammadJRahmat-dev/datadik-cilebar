-- Schema Setup
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    favicon_url TEXT,
    email TEXT,
    whatsapp TEXT,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    whatsapp_verified_at TIMESTAMP WITH TIME ZONE,
    address TEXT,
    type TEXT DEFAULT 'sekolah', -- 'sekolah', 'mitra', 'admin'
    theme_color TEXT DEFAULT '#2563eb',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    npsn TEXT UNIQUE NOT NULL,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_data ENABLE ROW LEVEL SECURITY;

-- Reset data if needed
TRUNCATE organizations, school_data CASCADE;

-- Insert organizations and school data
DO $$
DECLARE org_tkq_raudatul_jannah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('TKQ RAUDATUL JANNAH', '69979943') RETURNING id INTO org_tkq_raudatul_jannah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_tkq_raudatul_jannah, '69979943', '{"siswa": 47, "guru": 3, "pegawai": 2, "rombel": 4, "jenis": "TK", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_kb_al_ikhlas UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('KB AL - IKHLAS', '69846644') RETURNING id INTO org_kb_al_ikhlas;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_kb_al_ikhlas, '69846644', '{"siswa": 60, "guru": 3, "pegawai": 1, "rombel": 4, "jenis": "KB", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_kb_ar_rohmah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('KB AR - ROHMAH', '69846643') RETURNING id INTO org_kb_ar_rohmah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_kb_ar_rohmah, '69846643', '{"siswa": 60, "guru": 2, "pegawai": 1, "rombel": 5, "jenis": "KB", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_al_barokah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD AL - BAROKAH', '69847155') RETURNING id INTO org_pos_paud_al_barokah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_al_barokah, '69847155', '{"siswa": 71, "guru": 2, "pegawai": 1, "rombel": 4, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_al_hikmah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD AL - HIKMAH', '69847153') RETURNING id INTO org_pos_paud_al_hikmah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_al_hikmah, '69847153', '{"siswa": 42, "guru": 3, "pegawai": 3, "rombel": 3, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_al_ikhsan UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD AL - IKHSAN', '69847162') RETURNING id INTO org_pos_paud_al_ikhsan;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_al_ikhsan, '69847162', '{"siswa": 50, "guru": 0, "pegawai": 1, "rombel": 3, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_al_istiqomah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD AL ISTIQOMAH', '69990039') RETURNING id INTO org_pos_paud_al_istiqomah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_al_istiqomah, '69990039', '{"siswa": 28, "guru": 2, "pegawai": 1, "rombel": 2, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_alhidayah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD ALHIDAYAH', '69847160') RETURNING id INTO org_pos_paud_alhidayah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_alhidayah, '69847160', '{"siswa": 41, "guru": 3, "pegawai": 1, "rombel": 4, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_an_nur UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD AN - NUR', '69847161') RETURNING id INTO org_pos_paud_an_nur;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_an_nur, '69847161', '{"siswa": 84, "guru": 5, "pegawai": 1, "rombel": 5, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_an_nisa UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD AN NISA', '69847159') RETURNING id INTO org_pos_paud_an_nisa;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_an_nisa, '69847159', '{"siswa": 13, "guru": 0, "pegawai": 1, "rombel": 2, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_as_suhada UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD AS SUHADA', '69847158') RETURNING id INTO org_pos_paud_as_suhada;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_as_suhada, '69847158', '{"siswa": 71, "guru": 3, "pegawai": 1, "rombel": 4, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_bhakti_kencana UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD BHAKTI KENCANA', '69847152') RETURNING id INTO org_pos_paud_bhakti_kencana;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_bhakti_kencana, '69847152', '{"siswa": 100, "guru": 2, "pegawai": 1, "rombel": 7, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_cahaya_bunda UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD CAHAYA BUNDA', '69847157') RETURNING id INTO org_pos_paud_cahaya_bunda;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_cahaya_bunda, '69847157', '{"siswa": 96, "guru": 6, "pegawai": 0, "rombel": 6, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_dahlia UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD DAHLIA', '69847166') RETURNING id INTO org_pos_paud_dahlia;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_dahlia, '69847166', '{"siswa": 76, "guru": 3, "pegawai": 1, "rombel": 6, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_hamdallah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD HAMDALLAH', '69927084') RETURNING id INTO org_pos_paud_hamdallah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_hamdallah, '69927084', '{"siswa": 32, "guru": 5, "pegawai": 2, "rombel": 3, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_nurul_amal UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD NURUL AMAL', '69847156') RETURNING id INTO org_pos_paud_nurul_amal;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_nurul_amal, '69847156', '{"siswa": 54, "guru": 3, "pegawai": 1, "rombel": 4, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_nurul_hikmah UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD NURUL HIKMAH', '69847163') RETURNING id INTO org_pos_paud_nurul_hikmah;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_nurul_hikmah, '69847163', '{"siswa": 44, "guru": 1, "pegawai": 0, "rombel": 2, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_nurul_iman UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD NURUL IMAN', '69847154') RETURNING id INTO org_pos_paud_nurul_iman;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_nurul_iman, '69847154', '{"siswa": 72, "guru": 5, "pegawai": 1, "rombel": 4, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_pelita_bangsa UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD PELITA BANGSA', '69847164') RETURNING id INTO org_pos_paud_pelita_bangsa;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_pelita_bangsa, '69847164', '{"siswa": 39, "guru": 1, "pegawai": 1, "rombel": 2, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_qorro_abadan_babussalam UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD QORRO ABADAN BABUSSALAM', '69918055') RETURNING id INTO org_pos_paud_qorro_abadan_babussalam;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_qorro_abadan_babussalam, '69918055', '{"siswa": 34, "guru": 1, "pegawai": 1, "rombel": 2, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_pos_paud_teratai UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('POS PAUD TERATAI', '69847168') RETURNING id INTO org_pos_paud_teratai;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_pos_paud_teratai, '69847168', '{"siswa": 96, "guru": 4, "pegawai": 1, "rombel": 5, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_taam_hifa UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('TAAM HIFA', '69847167') RETURNING id INTO org_taam_hifa;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_taam_hifa, '69847167', '{"siswa": 27, "guru": 0, "pegawai": 1, "rombel": 2, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_taam_nurul_huda UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('TAAM NURUL HUDA', '69847165') RETURNING id INTO org_taam_nurul_huda;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_taam_nurul_huda, '69847165', '{"siswa": 67, "guru": 4, "pegawai": 1, "rombel": 4, "jenis": "SPS", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_cikande_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN CIKANDE I', '20236079') RETURNING id INTO org_sdn_cikande_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_cikande_i, '20236079', '{"siswa": 156, "guru": 9, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_cikande_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN CIKANDE II', '20236080') RETURNING id INTO org_sdn_cikande_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_cikande_ii, '20236080', '{"siswa": 80, "guru": 7, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_ciptamargi_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN CIPTAMARGI I', '20236124') RETURNING id INTO org_sdn_ciptamargi_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_ciptamargi_i, '20236124', '{"siswa": 146, "guru": 6, "pegawai": 3, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_ciptamargi_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN CIPTAMARGI II', '20236125') RETURNING id INTO org_sdn_ciptamargi_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_ciptamargi_ii, '20236125', '{"siswa": 146, "guru": 7, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_ciptamargi_iii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN CIPTAMARGI III', '20236126') RETURNING id INTO org_sdn_ciptamargi_iii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_ciptamargi_iii, '20236126', '{"siswa": 198, "guru": 7, "pegawai": 3, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_ciptamargi_iv UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN CIPTAMARGI IV', '20236127') RETURNING id INTO org_sdn_ciptamargi_iv;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_ciptamargi_iv, '20236127', '{"siswa": 162, "guru": 7, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kertamukti_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KERTAMUKTI I', '20236390') RETURNING id INTO org_sdn_kertamukti_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kertamukti_i, '20236390', '{"siswa": 153, "guru": 6, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kertamukti_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KERTAMUKTI II', '20236391') RETURNING id INTO org_sdn_kertamukti_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kertamukti_ii, '20236391', '{"siswa": 187, "guru": 8, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kertamukti_iii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KERTAMUKTI III', '20236392') RETURNING id INTO org_sdn_kertamukti_iii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kertamukti_iii, '20236392', '{"siswa": 200, "guru": 9, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kertamukti_iv UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KERTAMUKTI IV', '20236393') RETURNING id INTO org_sdn_kertamukti_iv;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kertamukti_iv, '20236393', '{"siswa": 190, "guru": 6, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kosambibatu_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KOSAMBIBATU I', '20236425') RETURNING id INTO org_sdn_kosambibatu_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kosambibatu_i, '20236425', '{"siswa": 108, "guru": 6, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kosambibatu_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KOSAMBIBATU II', '20236426') RETURNING id INTO org_sdn_kosambibatu_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kosambibatu_ii, '20236426', '{"siswa": 222, "guru": 9, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kosambibatu_iii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KOSAMBIBATU III', '20236427') RETURNING id INTO org_sdn_kosambibatu_iii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kosambibatu_iii, '20236427', '{"siswa": 109, "guru": 6, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_kosambibatu_iv UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN KOSAMBIBATU IV', '20236428') RETURNING id INTO org_sdn_kosambibatu_iv;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_kosambibatu_iv, '20236428', '{"siswa": 80, "guru": 8, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_mekarpohaci_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN MEKARPOHACI I', '20236558') RETURNING id INTO org_sdn_mekarpohaci_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_mekarpohaci_i, '20236558', '{"siswa": 163, "guru": 7, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_mekarpohaci_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN MEKARPOHACI II', '20236559') RETURNING id INTO org_sdn_mekarpohaci_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_mekarpohaci_ii, '20236559', '{"siswa": 165, "guru": 8, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_mekarpohaci_iii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN MEKARPOHACI III', '20236560') RETURNING id INTO org_sdn_mekarpohaci_iii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_mekarpohaci_iii, '20236560', '{"siswa": 154, "guru": 7, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_pusakajaya_selatan_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN PUSAKAJAYA SELATAN I', '20236752') RETURNING id INTO org_sdn_pusakajaya_selatan_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_pusakajaya_selatan_i, '20236752', '{"siswa": 122, "guru": 7, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_pusakajaya_selatan_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN PUSAKAJAYA SELATAN II', '20236753') RETURNING id INTO org_sdn_pusakajaya_selatan_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_pusakajaya_selatan_ii, '20236753', '{"siswa": 92, "guru": 6, "pegawai": 3, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_pusakajaya_selatan_iii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN PUSAKAJAYA SELATAN III', '20236754') RETURNING id INTO org_sdn_pusakajaya_selatan_iii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_pusakajaya_selatan_iii, '20236754', '{"siswa": 100, "guru": 5, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_pusakajaya_utara_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN PUSAKAJAYA UTARA I', '20236755') RETURNING id INTO org_sdn_pusakajaya_utara_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_pusakajaya_utara_i, '20236755', '{"siswa": 151, "guru": 8, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_pusakajaya_utara_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN PUSAKAJAYA UTARA II', '20236756') RETURNING id INTO org_sdn_pusakajaya_utara_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_pusakajaya_utara_ii, '20236756', '{"siswa": 219, "guru": 7, "pegawai": 3, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_pusakajaya_utara_iii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN PUSAKAJAYA UTARA III', '20236757') RETURNING id INTO org_sdn_pusakajaya_utara_iii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_pusakajaya_utara_iii, '20236757', '{"siswa": 85, "guru": 5, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_rawasari_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN RAWASARI I', '20236770') RETURNING id INTO org_sdn_rawasari_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_rawasari_i, '20236770', '{"siswa": 165, "guru": 7, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_sukaratu_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN SUKARATU I', '20236894') RETURNING id INTO org_sdn_sukaratu_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_sukaratu_i, '20236894', '{"siswa": 116, "guru": 5, "pegawai": 1, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_tanjungsari_i UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN TANJUNGSARI I', '20236968') RETURNING id INTO org_sdn_tanjungsari_i;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_tanjungsari_i, '20236968', '{"siswa": 287, "guru": 8, "pegawai": 2, "rombel": 12, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_sdn_tanjungsari_ii UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDN TANJUNGSARI II', '20236969') RETURNING id INTO org_sdn_tanjungsari_ii;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdn_tanjungsari_ii, '20236969', '{"siswa": 107, "guru": 6, "pegawai": 2, "rombel": 6, "jenis": "SD", "status": "Negeri"}'::jsonb);
END $$;

-- Insert Partner Organizations & District Admin
DO $$
BEGIN
  INSERT INTO organizations (name, slug, type) VALUES ('Kecamatan Cilebar', 'kecamatan-cilebar', 'admin');
  INSERT INTO organizations (name, slug, type) VALUES ('PGRI Cilebar', 'pgri-cilebar', 'mitra');
  INSERT INTO organizations (name, slug, type) VALUES ('BAPOPSI Cilebar', 'bapopsi-cilebar', 'mitra');
  INSERT INTO organizations (name, slug, type) VALUES ('F-KKG Cilebar', 'f-kkg-cilebar', 'mitra');
  INSERT INTO organizations (name, slug, type) VALUES ('KWARRAN Cilebar', 'kwarran-cilebar', 'mitra');
END $$;
DO $$
DECLARE org_sdit_al_ikhwan UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SDIT AL-IKHWAN', 'sdit-al-ikhwan') RETURNING id INTO org_sdit_al_ikhwan;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_sdit_al_ikhwan, '70037987', '{"siswa": 132, "guru": 9, "pegawai": 4, "rombel": 6, "jenis": "SD", "status": "Swasta"}'::jsonb);
END $$;
DO $$
DECLARE org_smpn_1_cilebar UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SMPN 1 CILEBAR', 'smpn-1-cilebar') RETURNING id INTO org_smpn_1_cilebar;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_smpn_1_cilebar, '20217927', '{"siswa": 508, "guru": 20, "pegawai": 8, "rombel": 16, "jenis": "SMP", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_smpn_2_cilebar UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SMPN 2 CILEBAR', 'smpn-2-cilebar') RETURNING id INTO org_smpn_2_cilebar;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_smpn_2_cilebar, '20255390', '{"siswa": 438, "guru": 15, "pegawai": 5, "rombel": 13, "jenis": "SMP", "status": "Negeri"}'::jsonb);
END $$;
DO $$
DECLARE org_smkn_cilebar UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('SMKN CILEBAR', 'smkn-cilebar') RETURNING id INTO org_smkn_cilebar;
  INSERT INTO school_data (org_id, npsn, stats) VALUES (org_smkn_cilebar, '69734350', '{"siswa": 170, "guru": 13, "pegawai": 3, "rombel": 8, "jenis": "SMK", "status": "Negeri"}'::jsonb);
END $$;
