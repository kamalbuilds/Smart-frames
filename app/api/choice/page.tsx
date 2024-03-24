import { FRAME_BASE_URL } from '@/lib/farcaster';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<Response> {
    // let the user go to /privy page

    return NextResponse.redirect(`${req.nextUrl.origin}/privy`, 302);
}

export const dynamic = 'force-dynamic';