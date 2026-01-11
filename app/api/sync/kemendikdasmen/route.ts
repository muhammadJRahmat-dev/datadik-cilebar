import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

/**
 * SOURCE DATA:
 * 1. referensi.data.kemendikdasmen.go.id (Untuk list sekolah & NPSN)
 * 2. referensi.data.kemendikdasmen.go.id/tabs.php?npsn=[NPSN] (Untuk koordinat lat/lng)
 */

const LIST_URLS = [
  'https://referensi.data.kemendikdasmen.go.id/pendidikan/dikdas/022132/3/jf/5/s1', // SD
  'https://referensi.data.kemendikdasmen.go.id/pendidikan/dikdas/022132/3/jf/6/s1', // SMP
];
const REFERENSI_DETAIL_URL = 'https://referensi.data.kemendikdasmen.go.id/tabs.php?npsn=';

export async function GET(req: NextRequest) {
  try {
    console.log('Starting advanced sync from Kemendikdasmen...');
    
    const allSchools: any[] = [];

    for (const url of LIST_URLS) {
      console.log(`Fetching list from: ${url}`);
      const { data: listHtml } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 20000
      });

      const $list = cheerio.load(listHtml);
      $list('#table1 tbody tr').each((i, el) => {
        const cols = $list(el).find('td');
        if (cols.length >= 6) {
          const npsn = $list(cols[1]).text().trim();
          const name = $list(cols[2]).text().trim();
          const address = $list(cols[3]).text().trim();
          const kelurahan = $list(cols[4]).text().trim();
          const status = $list(cols[5]).text().trim();

          if (npsn && name && /^\d+$/.test(npsn)) {
            allSchools.push({ npsn, name, address, kelurahan, status });
          }
        }
      });
    }

    if (allSchools.length === 0) {
      throw new Error('Tidak ada data sekolah ditemukan.');
    }

    console.log(`Found ${allSchools.length} schools to process.`);
    const results = [];

    for (const school of allSchools) {
      try {
        console.log(`Syncing details for: ${school.name} (${school.npsn})`);
        
        const { data: detailHtml } = await axios.get(`${REFERENSI_DETAIL_URL}${school.npsn}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000
        });

        const $detail = cheerio.load(detailHtml);
        let lat: number | null = null;
        let lng: number | null = null;

        const pageText = $detail('body').text();
        const latMatch = pageText.match(/Lintang:\s*(-?\d+\.\d+)/);
        const lngMatch = pageText.match(/Bujur:\s*(-?\d+\.\d+)/);

        if (latMatch) lat = parseFloat(latMatch[1]);
        if (lngMatch) lng = parseFloat(lngMatch[1]);

        // Find existing organization by name
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .ilike('name', school.name)
          .maybeSingle();

        let orgId;
        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          const slug = slugify(school.name);
          const { data: newOrg, error: insertError } = await supabase
            .from('organizations')
            .insert({
              name: school.name,
              slug,
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          orgId = newOrg?.id;
        }

        if (orgId) {
          const { data: existingData } = await supabase
            .from('school_data')
            .select('id, stats')
            .eq('org_id', orgId)
            .maybeSingle();

          const newStats = {
            ...(existingData?.stats || {}),
            address: school.address,
            kelurahan: school.kelurahan,
            status: school.status,
            lat,
            lng,
            last_sync: new Date().toISOString()
          };

          const schoolData = {
            org_id: orgId,
            npsn: school.npsn,
            stats: newStats,
          };

          if (existingData) {
            await supabase.from('school_data').update(schoolData).eq('id', existingData.id);
          } else {
            await supabase.from('school_data').insert(schoolData);
          }
        }

        results.push({ name: school.name, npsn: school.npsn, lat, lng, status: 'success' });
      } catch (err: any) {
        console.error(`Error syncing ${school.name}:`, err.message);
        results.push({ name: school.name, npsn: school.npsn, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: allSchools.length,
      data: results
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
