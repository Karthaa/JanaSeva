// Node script to seed Supabase with 5 facilities near 9.9312, 76.2673
import fs from 'fs';
import 'dotenv/config';

const SUPABASE_URL = 'https://ijofvlvmngxcyzyabfrd.supabase.co';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const facilities = [
  {
    name: 'South Kochi Public Toilet',
    type: 'toilet',
    status: 'clean',
    accessibility: 'wheelchair',
    location: 'SRID=4326;POINT(76.2673 9.9312)',
    address: 'South Junction, Kochi',
    managed_by: 'Kochi Corporation',
    last_verified_at: new Date().toISOString()
  },
  {
    name: 'Bypass Water Station',
    type: 'drinking_water',
    status: 'clean',
    accessibility: 'wheelchair',
    location: 'SRID=4326;POINT(76.2680 9.9325)',
    address: 'Near Bypass, Kochi',
    managed_by: 'KWA',
    last_verified_at: new Date().toISOString()
  },
  {
    name: 'Market Restroom Block',
    type: 'toilet',
    status: 'usable',
    accessibility: 'limited',
    location: 'SRID=4326;POINT(76.2650 9.9290)',
    address: 'South Market, Kochi',
    managed_by: 'Kochi Corporation',
    last_verified_at: new Date().toISOString()
  },
  {
    name: 'Park Drinking Fountain',
    type: 'drinking_water',
    status: 'usable',
    accessibility: 'limited',
    location: 'SRID=4326;POINT(76.2695 9.9300)',
    address: 'Community Park, Kochi',
    managed_by: 'GCDA',
    last_verified_at: new Date().toISOString()
  },
  {
    name: 'Station Accessible Toilet',
    type: 'toilet',
    status: 'clean',
    accessibility: 'wheelchair',
    location: 'SRID=4326;POINT(76.2660 9.9330)',
    address: 'Railway Station Road, Kochi',
    managed_by: 'Indian Railways',
    last_verified_at: new Date().toISOString()
  }
];

async function seed() {
  console.log('Seeding Supabase...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/facilities`, {
      method: 'POST',
      headers: {
        'apikey': SECRET_KEY,
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(facilities)
    });
    
    if (!res.ok) {
      console.error('Failed to insert:', await res.text());
    } else {
      console.log('Successfully inserted 5 facilities.');
    }
  } catch (err) {
    console.error('Error inserting:', err.message);
  }
}

seed();
