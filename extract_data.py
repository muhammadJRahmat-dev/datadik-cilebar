import pandas as pd
import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

file_path = r"C:\Users\muham\Downloads\Data Peserta Didik Kec. Cilebar - Dapodikdasmen 18-11-2025.xlsx"
# Skip first row which is the title, and second row which is empty header names
df = pd.read_excel(file_path, skiprows=1)

# Filter out rows where 'Nama Sekolah' is null
df = df[df['Nama Sekolah'].notnull()]

sql_statements = []

# Schema Setup
sql_statements.append("""-- Schema Setup
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
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

-- Public Read access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for organizations') THEN
        CREATE POLICY "Allow public read for organizations" ON organizations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for school_data') THEN
        CREATE POLICY "Allow public read for school_data" ON school_data FOR SELECT USING (true);
    END IF;
END $$;
""")

# Basic data reset (optional)
sql_statements.append("-- Reset data if needed")
sql_statements.append("TRUNCATE organizations, school_data CASCADE;")
sql_statements.append("")

sql_statements.append("-- Insert organizations and school data")
for _, row in df.iterrows():
    name = str(row['Nama Sekolah']).replace("'", "''")
    slug = slugify(name)
    npsn = str(row['NPSN'])
    bp = str(row['BP'])
    status = str(row['Status'])
    pd_count = int(row['PD']) if pd.notnull(row['PD']) else 0
    guru_count = int(row['Guru']) if pd.notnull(row['Guru']) else 0
    pegawai_count = int(row['Pegawai']) if pd.notnull(row['Pegawai']) else 0
    rombel = int(row['Rombel']) if pd.notnull(row['Rombel']) else 0
    
    # Create JSONB stats
    stats = {
        "siswa": pd_count,
        "guru": guru_count,
        "pegawai": pegawai_count,
        "rombel": rombel,
        "jenis": bp,
        "status": status
    }
    
    import json
    stats_json = json.dumps(stats)
    
    org_id_var = f"org_{slug.replace('-', '_')}"
    
    sql_statements.append(f"DO $$")
    sql_statements.append(f"DECLARE {org_id_var} UUID;")
    sql_statements.append(f"BEGIN")
    sql_statements.append(f"  INSERT INTO organizations (name, slug) VALUES ('{name}', '{slug}') RETURNING id INTO {org_id_var};")
    sql_statements.append(f"  INSERT INTO school_data (org_id, npsn, stats) VALUES ({org_id_var}, '{npsn}', '{stats_json}'::jsonb);")
    sql_statements.append(f"END $$;")

output_file = "supabase_seed.sql"
with open(output_file, "w", encoding='utf-8') as f:
    f.write("\n".join(sql_statements))

print(f"SQL script generated: {output_file}")
print(f"Total schools processed: {len(df)}")
