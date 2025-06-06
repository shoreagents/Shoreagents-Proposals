import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Types for our database tables
export type Proposal = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content: string; // HTML content
  url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  user_id?: string | null; // Optional: for future authentication
};

// Helper functions for proposals
export const proposalsApi = {
  // Get all proposals
  async getAll() {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get a single proposal by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id);
    
    if (error) throw error;
    return data?.[0] || null;
  },

  // Get a proposal by URL
  async getByUrl(url: string) {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('url', url);
    
    if (error) throw error;
    return data?.[0] || null;
  },

  // Create a new proposal
  async create(proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('proposals')
      .insert([proposal])
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  },

  // Update a proposal
  async update(id: string, updates: Partial<Omit<Proposal, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  },

  // Delete a proposal
  async delete(id: string) {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Check if a URL is available
  async isUrlAvailable(url: string, excludeId?: string) {
    const query = supabase
      .from('proposals')
      .select('id')
      .eq('url', url);
    
    if (excludeId) {
      query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    // If there's an error other than "no rows found", throw it
    if (error && error.code !== 'PGRST116') throw error;
    
    // If no rows were found or the query was successful but returned no data, the URL is available
    return !data || data.length === 0;
  }
}; 