import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
};

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

interface School {
  npsn: string;
  name: string;
  address: string;
  kelurahan: string;
  status: string;
}

interface SyncResult {
  name: string;
  npsn: string;
  lat: number | null;
  lng: number | null;
  status: 'success' | 'error';
  message?: string;
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database admin not configured' }, { status: 503 });
  }
  try {
    // Verify API key for security (optional but recommended)
    const apiKey = req.headers.get('x-api-key');
    if (process.env.SYNC_API_KEY && apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.warn('Starting advanced sync from Kemendikdasmen...');

    const allSchools: School[] = [];

    // Fetch school lists
    for (const url of LIST_URLS) {
      console.warn(`Fetching list from: ${url}`);

      try {
        const { data: listHtml } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 30000,
          maxRedirects: 5
        });

        if (!listHtml) {
          console.warn(`No data returned from ${url}`);
          continue;
        }

        const $list = cheerio.load(listHtml);
        $list('#table1 tbody tr').each((_, el) => {
          const $el = $list(el);
          const cols = $el.find('td');

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
      } catch (error) {
        console.error(`Error fetching ${url}:`, error instanceof Error ? error.message : error);
        // Continue to next URL
      }
    }

    if (allSchools.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data sekolah ditemukan. Pastikan URL Kemendikdasmen valid.' },
        { status: 400 }
      );
    }

    console.warn(`Found ${allSchools.length} schools to process.`);
    const results: SyncResult[] = [];

    // Process each school
    for (const school of allSchools) {
      try {
        console.warn(`Syncing details for: ${school.name} (${school.npsn})`);

        const { data: detailHtml } = await axios.get(`${REFERENSI_DETAIL_URL}${school.npsn}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 15000
        });

        if (!detailHtml) {
          throw new Error('No detail data returned');
        }

        const $detail = cheerio.load(detailHtml);
        let lat: number | null = null;
        let lng: number | null = null;

        // Try to extract coordinates from page text
        const pageText = $detail('body').text();
        const latMatch = pageText.match(/Lintang:\s*(-?\d+\.\d+)/);
        const lngMatch = pageText.match(/Bujur:\s*(-?\d+\.\d+)/);

        if (latMatch) lat = parseFloat(latMatch[1]);
        if (lngMatch) lng = parseFloat(lngMatch[1]);

        // Find existing organization by name
        const { data: existingOrg } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .ilike('name', school.name)
          .maybeSingle();

        let orgId: string | undefined;

        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          const slug = slugify(school.name);
          const { data: newOrg, error: insertError } = await supabaseAdmin
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
          const { data: existingData } = await supabaseAdmin
            .from('school_data')
            .select('id, stats')
            .eq('org_id', orgId)
            .maybeSingle();

          const newStats: Record<string, any> = {
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
            await supabaseAdmin.from('school_data').update(schoolData).eq('id', existingData.id);
          } else {
            await supabaseAdmin.from('school_data').insert(schoolData);
          }
        }

        results.push({ name: school.name, npsn: school.npsn, lat, lng, status: 'success' });

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error syncing ${school.name}:`, errorMessage);
        results.push({
          name: school.name,
          npsn: school.npsn,
          lat: null,
          lng: null,
          status: 'error',
          message: errorMessage
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: allSchools.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      data: results
    });

  } catch (error: unknown) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.';
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
