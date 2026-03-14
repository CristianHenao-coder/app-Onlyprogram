import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testMagicLink() {
  const email = 'felipebotero010@gmail.com'; // Use the user's email

  console.log('1. Generating magic link with Admin API');
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkError) {
    console.error('Error generating link:', linkError);
    return;
  }
  
  console.log('Generated Link Properties:', linkData.properties);
  const hashedToken = linkData.properties.hashed_token;
  console.log('Got hashed_token:', hashedToken);

  console.log('2. Verifying OTP with client API (type: magiclink)');
  const { data: verifyData, error: verifyError } = await supabaseClient.auth.verifyOtp({
    token_hash: hashedToken,
    type: 'magiclink'
  });

  if (verifyError) {
    console.error('Error verifying OTP (type magiclink):', verifyError);
    
    console.log('3. Retrying with type: email');
    const { data: verifyData2, error: verifyError2 } = await supabaseClient.auth.verifyOtp({
      token_hash: hashedToken,
      type: 'email'
    });
    
    if (verifyError2) {
      console.error('Error verifying OTP (type email):', verifyError2);
    } else {
      console.log('Success with type email!', verifyData2.user?.id);
    }
  } else {
    console.log('Success with type magiclink!', verifyData.user?.id);
  }
}

testMagicLink();
