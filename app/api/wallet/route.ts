import { errorFrame, parseFrameRequest, getOwnerAddressFromFid, successFrame, createWalletFrame, choosewallet, FrameImageUrls } from '@/lib/farcaster';
import { FrameRequest } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { createOrFindEmbeddedWalletForFid } from '@/lib/embedded-wallet';

export async function POST(req: NextRequest): Promise<Response> {

    // When a user interacts with your Frame, you receive a JSON message called the "Frame Signature Packet". 
    // Decode and validate this message using the getFrameMessage function.
    let frameRequest: FrameRequest | undefined;

    // Parse and validate request from Frame for fid
    try {
        frameRequest = await req.json();
        console.log(frameRequest,"frame req");
        if (!frameRequest) throw new Error('Could not deserialize request from frame');
    } catch {
        console.log("error in getting frame request");
        return new NextResponse(errorFrame);
    }

    // Query FC Registry contract to get owner address from fid
    const ownerAddress = await getOwnerAddressFromFid(frameRequest.untrustedData.fid);
    console.log(ownerAddress,"owner")
    if (!ownerAddress) return new NextResponse(errorFrame);

    // Generate an embedded wallet associated with the fid
    //@ts-ignore
    if(frameRequest.untrustedData?.inputText) {
        console.log("dynamic embedded wallet");
        //@ts-ignore
        const embeddedWalletAddress = await createOrFindEmbeddedWalletForFid(frameRequest.untrustedData.fid, ownerAddress,"dynamic", frameRequest.untrustedData.inputText);
        return new NextResponse(choosewallet(FrameImageUrls.START, embeddedWalletAddress[0],embeddedWalletAddress[1], "api/solvsevm" ));
    }

    const embeddedWalletAddress = await createOrFindEmbeddedWalletForFid(frameRequest.untrustedData.fid, ownerAddress,"privy");

    console.log(embeddedWalletAddress,"embedded wallet");
    if (!embeddedWalletAddress) return new NextResponse(errorFrame);

    return new NextResponse(createWalletFrame(embeddedWalletAddress));
}

export const dynamic = 'force-dynamic';