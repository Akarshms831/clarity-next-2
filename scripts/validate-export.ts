import fs from 'node:fs';
import path from 'node:path';
const file = process.argv[2];
if (!file) { console.error('Usage: npm run data:validate -- ./supabase-export.json'); process.exit(2); }
const raw = JSON.parse(fs.readFileSync(path.resolve(file),'utf8'));
const rows = Array.isArray(raw) ? raw : [raw];
let valid = true;
for (const [i,row] of rows.entries()) {
  if (!row || typeof row !== 'object' || !('user_id' in row) || !('payload' in row)) {
    console.error(`Row ${i+1}: expected user_id and payload fields.`); valid = false; continue;
  }
  if (typeof row.user_id !== 'string' || !row.user_id) { console.error(`Row ${i+1}: invalid user_id.`); valid = false; }
  if (typeof row.payload !== 'object' || row.payload === null) { console.error(`Row ${i+1}: payload must be a JSON object.`); valid = false; }
}
if (!valid) process.exit(1);
console.log(`Validated ${rows.length} Supabase row(s). No data was imported or modified.`);
