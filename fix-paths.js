import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mapeo de paths alias a rutas reales en dist
const aliasMap = {
  '@domain/': 'src/domain/',
  '@application/': 'src/application/',
  '@infrastructure/': 'src/infrastructure/',
  '@presentation/': 'src/presentation/',
};

// Función recursiva para encontrar todos los archivos .js
function findJsFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir);
    files.forEach(file => {
      const filePath = join(dir, file);
      try {
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
          findJsFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
          fileList.push(filePath);
        }
      } catch (err) {
        // Ignorar errores de acceso
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  return fileList;
}

// Función para reemplazar paths en un archivo
function fixPathsInFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let originalContent = content;
    const distPath = join(__dirname, 'dist');

    // Reemplazar cada alias
    for (const [alias, targetPath] of Object.entries(aliasMap)) {
      // Escapar el alias para regex
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Buscar imports con el alias (comillas simples o dobles)
      const regex = new RegExp(`(from\\s+['"])${escapedAlias}([^'"]+)(['"])`, 'g');
      
      content = content.replace(regex, (match, prefix, importPath, suffix) => {
        // Calcular la ruta relativa desde el archivo actual hasta el target
        const currentDir = dirname(filePath);
        const targetFile = join(distPath, targetPath, importPath);
        // Asegurar que termine en .js
        const targetFileWithExt = targetFile.endsWith('.js') ? targetFile : targetFile + '.js';
        let relativePath = relative(currentDir, targetFileWithExt);
        // Normalizar separadores de ruta
        relativePath = relativePath.replace(/\\/g, '/');
        // Asegurar que la ruta relativa comience con ./
        if (!relativePath.startsWith('.')) {
          relativePath = './' + relativePath;
        }
        // Mantener el formato original del import
        return `${prefix}${relativePath}${suffix}`;
      });
    }

    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed paths in: ${filePath.replace(__dirname + '/', '')}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return false;
  }
}

// Buscar todos los archivos .js en dist
const distPath = join(__dirname, 'dist');
console.log(`Looking for .js files in: ${distPath}`);

try {
  if (!statSync(distPath).isDirectory()) {
    console.error(`Error: ${distPath} is not a directory`);
    process.exit(1);
  }
} catch (err) {
  console.error(`Error accessing ${distPath}:`, err.message);
  process.exit(1);
}

const files = findJsFiles(distPath);
console.log(`Found ${files.length} files to process...`);

let fixedCount = 0;
files.forEach(file => {
  if (fixPathsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\nDone! Fixed paths in ${fixedCount} files.`);
