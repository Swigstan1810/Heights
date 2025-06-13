import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  // Generate a random UUID for test
  const userId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();

  // Try to insert a test row
  const { data, error } = await supabase
    .from('wallet_balance')
    .insert({
      user_id: userId,
      balance: 0,
      locked_balance: 0,
      currency: 'INR'
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, error: error.message });
  } else {
    res.status(200).json({ success: true, data });
  }
} 