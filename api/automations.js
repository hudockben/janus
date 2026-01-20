import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables not set');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    return res.status(500).json({
      error: 'Database not configured. Supabase connection details missing.',
      hint: 'Check Vercel environment variables for SUPABASE_URL and SUPABASE keys'
    });
  }

  try {
    console.log('Automations API called:', req.method);
    console.log('Connecting to Supabase...');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET - Retrieve all automations
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
          console.log('Automations table does not exist yet');
          return res.status(200).json({ automations: [] });
        }
        throw error;
      }

      // Convert DB format to app format
      const automations = (data || []).map(row => ({
        id: row.automation_id,
        name: row.name,
        schedule: row.schedule,
        time: row.time,
        condition: row.condition,
        threshold: row.threshold,
        notifyEmail: row.notify_email,
        notifyMethod: row.notify_method,
        active: row.active
      }));

      console.log('Retrieved automations:', automations.length);
      return res.status(200).json({ automations });
    }

    // POST - Save automations (full replacement)
    if (req.method === 'POST') {
      const { automations } = req.body;

      if (!Array.isArray(automations)) {
        return res.status(400).json({ error: 'automations must be an array' });
      }

      // Delete all existing automations
      const { error: deleteError } = await supabase
        .from('automations')
        .delete()
        .neq('id', 0); // Delete all rows

      if (deleteError && deleteError.code !== '42P01') {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Insert new automations
      if (automations.length > 0) {
        const records = automations.map(auto => ({
          automation_id: auto.id,
          name: auto.name,
          schedule: auto.schedule,
          time: auto.time,
          condition: auto.condition,
          threshold: auto.threshold || null,
          notify_email: auto.notifyEmail || null,
          notify_method: auto.notifyMethod,
          active: auto.active
        }));

        const { error: insertError } = await supabase
          .from('automations')
          .insert(records);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      console.log('Saved automations:', automations.length);
      return res.status(200).json({ success: true, count: automations.length });
    }

    // DELETE - Clear all automations
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('automations')
        .delete()
        .neq('id', 0); // Delete all rows

      if (error && error.code !== '42P01') {
        throw error;
      }

      console.log('Deleted all automations');
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Automations API error:', err);
    return res.status(500).json({
      error: 'Server error: ' + err.message,
      details: err.toString(),
      code: err.code
    });
  }
}
