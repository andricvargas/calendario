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
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Función para reemplazar paths en un archivo
function fixPathsInFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  const distPath = join(__dirname, 'dist');

  // Reemplazar cada alias
  for (const [alias, targetPath] of Object.entries(aliasMap)) {
    // Buscar imports con el alias
    const regex = new RegExp(`from ['"]${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]+)['"]`, 'g');
    
    content = content.replace(regex, (match, importPath) => {
      modified = true;
      // Calcular la ruta relativa desde el archivo actual hasta el target
      const currentDir = dirname(filePath);
      const targetFile = join(distPath, targetPath, importPath);
      // Asegurar que termine en .js
      const targetFileWithExt = targetFile.endsWith('.js') ? targetFile : targetFile + '.js';
      const relativePath = relative(currentDir, targetFileWithExt);
      // Asegurar que la ruta relativa comience con ./
      const finalPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
      return `from '${finalPath.replace(/\\/g, '/')}'`;
    });
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed paths in: ${filePath.replace(__dirname + '/', '')}`);
  }
}

// Buscar todos los archivos .js en dist
const distPath = join(__dirname, 'dist');
const files = findJsFiles(distPath);

console.log(`Found ${files.length} files to process...`);
files.forEach(fixPathsInFile);
console.log('Done fixing paths!');
