// backend/scripts/backfillCoordinates.ts
import 'dotenv/config'
import { connectDB } from '../src/lib/db'
import { Mechanic } from '../src/models/Mechanic'   // named import
import { geocodeCity } from '../src/lib/geo'        // use our existing geo function

async function backfillCoordinates() {
  console.log('🔧 Starting coordinate backfill...')
  await connectDB()
  console.log('✅ Connected to database')

  // Find all mechanics that have placeholder or missing coordinates
  const mechanics = await Mechanic.find({
    $or: [
      // Missing location field entirely
      { location: { $exists: false } },
      // Coordinates set to the placeholder [3.3, 6.5]
      { 'location.coordinates': [3.3, 6.5] },
      // Coordinates array is empty
      { 'location.coordinates': { $size: 0 } },
      // No coordinates at all (field exists but empty)
      { 'location.coordinates': { $exists: true, $size: 0 } },
    ],
  })

  console.log(`📋 Found ${mechanics.length} mechanics needing coordinates`)

  let updated = 0
  let failed = 0

  for (const mechanic of mechanics) {
    const city = mechanic.city
    if (!city) {
      console.warn(`⚠️  Mechanic ${mechanic._id} (${mechanic.name}) has no city – skipping`)
      failed++
      continue
    }

    console.log(`🌍 Geocoding ${mechanic.name} (${city})...`)
    const coords = await geocodeCity(city)

    if (coords) {
      mechanic.location = {
        type: 'Point',
        coordinates: [coords.lng, coords.lat], // GeoJSON: [longitude, latitude]
      }
      await mechanic.save()
      console.log(`✅ Updated ${mechanic.name} → ${coords.lat}, ${coords.lng}`)
      updated++
    } else {
      console.warn(`❌ Could not geocode ${mechanic.name} (city: ${city})`)
      failed++
    }

    // Small delay to avoid hitting Nominatim rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Failed: ${failed}`)
  process.exit(0)
}

backfillCoordinates().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})