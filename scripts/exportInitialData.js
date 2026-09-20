import { INITIAL_TENANTS_MAP } from '../apps/web/src/data/initialData';
import fs from 'fs';
import path from 'path';
const outPath = path.resolve(__dirname, '../apps/api/data/store.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(INITIAL_TENANTS_MAP, null, 2), 'utf-8');
console.log('Successfully generated store.json with', Object.keys(INITIAL_TENANTS_MAP).length, 'tenants');
//# sourceMappingURL=exportInitialData.js.map