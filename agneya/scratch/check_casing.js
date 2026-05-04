
import fs from 'fs';
import path from 'path';

const root = 'e:/AGNEYAw/agneya/src';

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath.replace(/\\/g, '/'));
    }
  });
  return fileList;
}

const allFiles = getAllFiles(root);
const fileSet = new Set(allFiles);

function checkFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+.*\s+from\s+['"](\.?\.?\/[^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];
        if (!importPath.startsWith('.')) continue;

        const dir = path.dirname(filePath);
        let targetPath = path.resolve(dir, importPath).replace(/\\/g, '/');
        
        // Try extensions
        let found = false;
        let actualCasing = '';
        
        const extensions = ['', '.jsx', '.js', '.css', '.json'];
        for (const ext of extensions) {
            const p = targetPath + ext;
            // Check if file exists with EXACT casing
            // On Windows fs.existsSync is case-insensitive.
            // So we need to check the directory content for exact match.
            const targetDir = path.dirname(p);
            const targetBase = path.basename(p);
            if (fs.existsSync(targetDir)) {
                const filesInDir = fs.readdirSync(targetDir);
                if (filesInDir.includes(targetBase)) {
                    found = true;
                    break;
                } else {
                    // Check if it exists with DIFFERENT casing
                    const lowerFiles = filesInDir.map(f => f.toLowerCase());
                    const idx = lowerFiles.indexOf(targetBase.toLowerCase());
                    if (idx !== -1) {
                        console.log(`CASE MISMATCH in ${filePath}:`);
                        console.log(`  Imported: ${importPath}`);
                        console.log(`  Actual:   ${filesInDir[idx]}`);
                    }
                }
            }
        }
    }
}

allFiles.forEach(checkFile);
