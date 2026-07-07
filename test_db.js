import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snixuzaslqdnbduqmazs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuaXh1emFzbHFkbmJkdXFtYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTQwMTYsImV4cCI6MjA5NzYzMDAxNn0.Ehu6TynJ01nCrXeUI8d0AwZrgfseNtYrmdAnjiOlXuM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: channels, error } = await supabase.from('channels').select('*');
  console.log("All channels:", channels);
  console.log("Error:", error);
}

check();
