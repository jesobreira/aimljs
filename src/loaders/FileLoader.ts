import type { FileSource } from '../types';

export interface FileContent {
  name: string;
  content: string;
}

export async function loadFileSource(source: FileSource): Promise<FileContent> {
  // Pre-loaded content
  if (typeof source === 'object' && !(source instanceof File) && 'content' in source) {
    return { name: source.name, content: source.content };
  }

  // Browser File object
  if (typeof File !== 'undefined' && source instanceof File) {
    const content = await readBrowserFile(source);
    return { name: source.name, content };
  }

  // Node.js file path (string)
  if (typeof source === 'string') {
    return loadNodeFile(source);
  }

  throw new Error('Unsupported file source type');
}

function readBrowserFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file, 'utf-8');
  });
}

async function loadNodeFile(filePath: string): Promise<FileContent> {
  // Dynamic import to avoid bundler errors in browser
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const content = await fs.readFile(filePath, 'utf-8');
    return { name: path.basename(filePath), content };
  } catch (e) {
    throw new Error(`Failed to load file "${filePath}": ${String(e)}`);
  }
}

export async function loadDirectory(
  dirPath: string,
  extensions: string[] = ['.aiml'],
  recursive = true,
): Promise<FileContent[]> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const results: FileContent[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        await walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.some(e => e.toLowerCase() === ext)) {
          const content = await fs.readFile(full, 'utf-8');
          results.push({ name: full, content });
        }
      }
    }
  }

  await walk(dirPath);
  return results;
}
