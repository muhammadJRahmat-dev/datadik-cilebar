import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

// URL Dapodik Cilebar (Hardcoded for now as requested)
const DAPO_URL = 'https://dapo.kemdikbud.go.id/rekap/progres-data?id_level_wilayah=3&kode_wilayah=021216&semester_id=20241';

export async function GET(req: NextRequest) {
  try {
    const { data: html } = await axios.get(DAPO_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(html);
    const schools: any[] = [];

    // Note: Structure of Dapodik page might vary, this is a general approach
    // We expect a table with school data
    $('table tr').each((i, el) => {
      if (i === 0) return; // Skip header

      const cols = $(el).find('td');
      if (cols.length >= 4) {
        const name = $(cols[1]).text().trim();
        const npsn = $(cols[2]).text().trim();
        const address = $(cols[3]).text().trim() || 'Cilebar, Karawang';
        const total_students = parseInt($(cols[4]).text().trim()) || 0;

        if (name && npsn) {
          schools.push({ name, npsn, address, total_students });
        }
      }
    });

    const results = [];

    for (const school of schools) {
      // 1. Check if school exists (fuzzy name match or NPSN)
      const { data: existingOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .or(`name.ilike.%${school.name}%,slug.eq.${slugify(school.name)}`)
        .single();

      if (existingOrg) {
        // UPDATE
        const { error: updateOrgError } = await supabase
          .from('organizations')
          .update({ address: school.address })
          .eq('id', existingOrg.id);

        const { error: updateDataError } = await supabase
          .from('school_data')
          .update({ 
            npsn: school.npsn,
            jml_siswa: school.total_students,
            last_updated: new Date().toISOString()
          })
          .eq('org_id', existingOrg.id);

        results.push({ name: school.name, action: 'updated', status: !updateOrgError && !updateDataError });
      } else {
        // INSERT NEW
        const slug = slugify(school.name);
        
        const { data: newOrg, error: insertOrgError } = await supabase
          .from('organizations')
          .insert({
            name: school.name,
            slug: slug,
            type: 'sekolah',
            address: school.address,
            theme_color: '#2563eb'
          })
          .select()
          .single();

        if (newOrg && !insertOrgError) {
          const { error: insertDataError } = await supabase
            .from('school_data')
            .insert({
              org_id: newOrg.id,
              npsn: school.npsn,
              jml_siswa: school.total_students,
              jml_guru: 0,
              dynamic_info: {}
            });

          results.push({ name: school.name, action: 'inserted', status: !insertDataError });
        } else {
          results.push({ name: school.name, action: 'failed', error: insertOrgError });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${schools.length} schools`,
      data: results 
    });

  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-')       // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}
