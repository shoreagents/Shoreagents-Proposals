import { proposalsApi } from './supabase';

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function ensureUniqueUrl(url: string): Promise<string> {
  let uniqueUrl = url;
  let counter = 1;
  
  while (!(await proposalsApi.isUrlAvailable(uniqueUrl))) {
    uniqueUrl = `${url}-${counter}`;
    counter++;
  }
  
  return uniqueUrl;
} 