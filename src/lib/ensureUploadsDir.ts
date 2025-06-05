import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');

export async function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
} 