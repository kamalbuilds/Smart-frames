import { errorFrame, parseFrameRequest, getOwnerAddressFromFid, successFrame, createWalletFrame } from '@/lib/farcaster';
import { FrameRequest } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { createOrFindEmbeddedWalletForFid } from '@/lib/embedded-wallet';

export async function POST(req: NextRequest): Promise<Response> {

    // When a user interacts with your Frame, you receive a JSON message called the "Frame Signature Packet". 
    // Decode and validate this message using the getFrameMessage function.
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

    // Query FC Registry contract to get owner address from fid
    const ownerAddress = await getOwnerAddressFromFid(fid);
    if (!ownerAddress) return new NextResponse(errorFrame);

    // Generate an embedded wallet associated with the fid
    const embeddedWalletAddress = await createOrFindEmbeddedWalletForFid(fid, ownerAddress,"privy");
    if (!embeddedWalletAddress) return new NextResponse(errorFrame);

    return new NextResponse(createWalletFrame(embeddedWalletAddress));
}

export const dynamic = 'force-dynamic';