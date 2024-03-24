import { FRAME_BASE_URL, FrameImageUrls, PrivyFrame, createFrame, dynamicFrameWithEmailInput, errorFrame, parseFrameRequest } from '@/lib/farcaster';
import { FrameRequest, getFrameMetadata } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest): Promise<Response> {

    let frameRequest: FrameRequest | undefined;

    console.log(frameRequest,"frame req");
    // Parse and validate request from Frame for fid
    try {
        frameRequest = await req.json();
        console.log(frameRequest,"frame req");
        if (!frameRequest) throw new Error('Could not deserialize request from frame');
    } catch {
        return new NextResponse(errorFrame);
    }
    const {fid, isValid} = await parseFrameRequest(frameRequest);
    if (!fid || !isValid) return new NextResponse(errorFrame);

    if(frameRequest.untrustedData.buttonIndex == 1) {
        return new NextResponse(createFrame(FrameImageUrls.START, 'Create a wallet', 'api/wallet'));
    }
    else if(frameRequest.untrustedData.buttonIndex == 2) {
        return new NextResponse(dynamicFrameWithEmailInput);
    }

    return new NextResponse(createFrame(FrameImageUrls.START, 'Create a wallet', 'api/wallet'));
}

export const dynamic = 'force-dynamic';