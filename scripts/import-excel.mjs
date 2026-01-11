import xlsx from 'xlsx'
import { createClient } from '@supabase/supabase-js'

function getVal(row, keys) {
  for (const k of keys) {
    const found = Object.keys(row).find(h => h.trim().toLowerCase() === k.trim().toLowerCase())
    if (found && row[found] !== undefined && row[found] !== null) return row[found]
  }
  return undefined
}

function toNumber(v) {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || undefined
}

async function main() {
  const filePath = process.argv[2] || process.env.EXCEL_FILE
  if (!filePath) {
    console.error('Missing Excel file path. Usage: npm run import:excel -- <path-to-file>')
    process.exit(1)
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey || url.includes('placeholder.supabase.co')) {
    console.error('Supabase env missing or placeholder. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }
  const wb = xlsx.readFile(filePath)
  const sheetName = process.argv[3] || wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  if (!sheet) {
    console.error(`Sheet "${sheetName}" not found`)
    process.exit(1)
  }
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' })
  const supabase = createClient(url, serviceKey)
  let inserted = 0
  for (const row of rows) {
    const name = getVal(row, ['nama sekolah', 'sekolah', 'nama'])
    const npsnRaw = getVal(row, ['npsn'])
    const npsn = npsnRaw ? String(npsnRaw).replace(/\D/g, '') : undefined
    const jenis = getVal(row, ['jenjang', 'jenis', 'tingkat'])
    const status = getVal(row, ['status'])
    const alamat = getVal(row, ['alamat', 'address'])
    const siswa = toNumber(getVal(row, ['siswa', 'jumlah siswa', 'jml siswa', 'total siswa']))
    const guru = toNumber(getVal(row, ['guru', 'jumlah guru', 'jml guru', 'total guru']))
    const rombel = toNumber(getVal(row, ['rombel', 'jumlah rombel', 'jml rombel']))
    const lat = toNumber(getVal(row, ['lat', 'latitude']))
    const lng = toNumber(getVal(row, ['lng', 'longitude', 'long']))
    const wa = getVal(row, ['wa', 'kontak wa', 'whatsapp'])
    const email = getVal(row, ['email', 'kontak email'])

    if (!name && !npsn) continue
    let slug = slugify(name)
    if (!slug && npsn) slug = `n${npsn}`
    if (!slug) continue

    const { data: orgUpsert, error: orgErr } = await supabase
      .from('organizations')
      .upsert({
        slug,
        name: name || slug,
        type: 'sekolah',
        address: alamat || null,
      }, { onConflict: 'slug' })
      .select('id')
      .single()
    if (orgErr) {
      console.error('Organization upsert error', orgErr)
      continue
    }
    const orgId = orgUpsert.id

    const payload = {
      org_id: orgId,
      npsn: npsn || null,
      lat: lat ?? null,
      lng: lng ?? null,
      jml_siswa: siswa ?? 0,
      jml_guru: guru ?? 0,
      dynamic_info: {
        jenis: jenis || null,
        status: status || null,
        rombel: rombel ?? null,
        kontak_wa: wa || null,
        kontak_email: email || null,
        lat: lat ?? null,
        lng: lng ?? null
      }
    }

    const { data: existing, error: selErr } = await supabase
      .from('school_data')
      .select('id')
      .eq('org_id', orgId)
      .maybeSingle()

    if (selErr) {
      console.error('School data select error', selErr)
      continue
    }

    if (existing && existing.id) {
      const { error: updErr } = await supabase
        .from('school_data')
        .update(payload)
        .eq('id', existing.id)
      if (updErr) {
        console.error('School data update error', updErr)
        continue
      }
    } else {
      const { error: insErr } = await supabase
        .from('school_data')
        .insert(payload)
      if (insErr) {
        console.error('School data insert error', insErr)
        continue
      }
    }
    inserted++
  }
  console.log(`Imported ${inserted} schools from "${sheetName}"`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
