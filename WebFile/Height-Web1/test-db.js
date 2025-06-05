const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jeuyvgzqjrpfenmuibkw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXl2Z3pxanJwZmVubXVpYmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MDk3OTEsImV4cCI6MjA2MTk4NTc5MX0.t0sEzEOKoSuZ10SZhBzvLMCuYMkAuyXSVLEm771tavc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('Testing Supabase connection...');
  
  // Use a unique email for testing
  const testEmail = 'test' + Date.now() + '@yourdomain.com';
  const testPassword = 'TestPassword123!';

  // Test signup
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  
  console.log('Signup result:', { signUpData, signUpError });
  
  // Test signin
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  console.log('Signin result:', { signInData, signInError });
}

testAuth(); 