import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Heights (${userId})`,
      issuer: 'Heights Trading',
      length: 32
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    
    // Save secret to database (encrypted in production)
    await supabase
      .from('user_2fa_secrets')
      .upsert({
        user_id: userId,
        secret: secret.base32, // Encrypt this in production
        backup_codes: generateBackupCodes(),
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      qrCode: qrCodeUrl,
      secret: secret.base32,
      backupCodes: generateBackupCodes()
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}