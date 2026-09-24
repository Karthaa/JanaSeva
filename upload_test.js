import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env manually
const env = readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim();
  return acc;
}, {});

const supabase = createClient(
  env['VITE_SUPABASE_URL'],
  env['VITE_SUPABASE_ANON_KEY']
);

async function testUpload() {
  console.log("1. Starting upload test...");
  
  // Read the provided image file
  const fileContent = readFileSync("c:\\Users\\jayak\\.gemini\\antigravity-ide\\brain\\a11f0a7d-cb2e-4f0c-972c-2a2ebeac488b\\.user_uploaded\\media_1790205068297.jpg");
  
  const path = `reports/test-id-123/${Date.now()}-test_image.jpg`;
  console.log("2. Uploading to path:", path);
  
  console.log("3. Calling supabase.storage.from('report-images').upload()...");
  const { data, error } = await supabase.storage
    .from('report-images')
    .upload(path, fileContent, {
      contentType: 'image/jpeg',
      upsert: false
    });
    
  console.log("4. STORAGE UPLOAD RESULT:");
  if (error) {
    console.log("ERROR:", JSON.stringify(error, null, 2));
    console.log("EXACT SUPABASE ERROR MESSAGE:", error.message);
  } else {
    console.log("DATA:", data);
    console.log("FILE APPEARS IN SUPABASE STORAGE: YES");
  }
}

testUpload();
