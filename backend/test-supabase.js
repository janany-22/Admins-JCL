const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://knesrbcxvilzfcgxpshp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZXNyYmN4dmlsemZjZ3hwc2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNjc3MTksImV4cCI6MjA1Njc0MzcxOX0.PyPFZgP4wIYvYmDyaC_XV1UjvcHZ8CaS3YISxJ7Azm4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('builders').select('*').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return;
    }
    console.log('Supabase connection test successful:', data);
  } catch (err) {
    console.error('Error during Supabase test:', err);
  }
}

testConnection();