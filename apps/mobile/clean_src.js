const fs = require('fs');
const path = require('path');

function cleanDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      cleanDir(fullPath);
    } else {
      if (
        file.name.endsWith('.js') ||
        file.name.endsWith('.js.map') ||
        file.name.endsWith('.d.ts.map') ||
        (file.name.endsWith('.d.ts') && file.name !== 'ambient.d.ts')
      ) {
        fs.unlinkSync(fullPath);
        console.log('Removed:', fullPath);
      }
    }
  }
}

cleanDir(path.join(__dirname, 'src'));
console.log('Finished cleaning src directory');
