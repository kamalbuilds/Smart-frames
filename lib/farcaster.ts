import { FrameRequest } from "@coinbase/onchainkit";
import { createPublicClient, getContract, http } from "viem";
import { optimism } from "viem/chains";
import { getSSLHubRpcClient, Message } from '@farcaster/hub-nodejs';

export const FRAME_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://privy-frames-demo.vercel.app';
const ID_REGISTRY_CONTRACT_ADDRESS: `0x${string}` = '0x00000000fc6c5f01fc30151999387bb99a9f489b'; // Optimism Mainnet
const ZERO_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000';
const HUB_URL = 'nemes.farcaster.xyz:2283';

export enum FrameImageUrls {
    START = 'https://smartframes.vercel.app/landing.png',
    WALLET = 'https://smartframes.vercel.app/wallet.png',
    SUCCESS = 'https://smartframes.vercel.app/success.png',
    ERROR = 'https://smartframes.vercel.app/error.png',
    CHOICE = 'https://smartframes.vercel.app/choice.png',
    SOLVSEVM = 'https://smartframes.vercel.app/solvsevm.png',
    EMAIL = 'https://smartframes.vercel.app/email.png',
}

export const createFrame = (imageUrl: string, buttonText: string, apiPath: string, isRedirect = false) => {
    return (`
        <!DOCTYPE html>
        <html>
            <head>
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${imageUrl}">
            <meta name="fc:frame:post_url" content="${FRAME_BASE_URL}/${apiPath}">
            <meta name="fc:frame:button:1" content="${buttonText}">
            <meta name="fc:frame:button:1:action" content="${isRedirect ? 'post_redirect' : 'post'}">
            </head>
        </html>`);
}


export const dynamicEmbeddedFrame = (imageUrl: string, buttonText: string, apiPath: string, emailInputPlaceholder: string) => {
    return (`
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="fc:frame" content="vNext">
                <meta name="fc:frame:image" content="${imageUrl}">
                <meta name="fc:frame:post_url" content="${FRAME_BASE_URL}/${apiPath}">
                <meta name="fc:frame:input:text" content="${emailInputPlaceholder}">
                <meta name="fc:frame:button:1" content="${buttonText}">
                <meta name="fc:frame:button:1:action" content="post">
            </head>
        </html>
    `);
};

export const choosewallet = (imageUrl: string, button1Text: string,button2Text: string, apiPath: string, isRedirect = false) => {
    return (`
        <!DOCTYPE html>
        <html>
            <head>
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${imageUrl}">
            <meta name="fc:frame:post_url" content="${FRAME_BASE_URL}/${apiPath}">
            <meta name="fc:frame:button:1" content="${button1Text}">
            <meta name="fc:frame:button:2" content="${button2Text}">
            <meta name="fc:frame:button:1:action" content="${isRedirect ? 'post_redirect' : 'post'}">
            </head>
        </html>`);
}

export const createWalletFrame = (address: string) => {
    return createFrame(FrameImageUrls.WALLET, 'Mint your NFT', `api/mint/${address}`)
}

// Example usage
export const dynamicFrameWithEmailInput = dynamicEmbeddedFrame(
    FrameImageUrls.EMAIL,
    'Create SOL + EVM Embedded Wallets',
    'api/wallet',
    'Enter your email'
);

export const PrivyFrame = createFrame(FrameImageUrls.START, 'Create a wallet', 'api/wallet');
export const successFrame = createFrame(FrameImageUrls.SUCCESS, 'Done', 'api/done', true);
export const errorFrame = createFrame(FrameImageUrls.ERROR, 'Try again?', 'api/wallet');

// Enhanced parseFrameRequest with retry logic
export const parseFrameRequest = async (request: FrameRequest) => {
    const hub = getSSLHubRpcClient(HUB_URL);
    let retryCount = 0;
    const maxRetries = 6; // Set the maximum number of retries
    let fid: number | undefined;
    let isValid = false;

    while (retryCount < maxRetries && !isValid) {
        try {
            const decodedMessage = Message.decode(Buffer.from(request.trustedData.messageBytes, "hex"));
            const result = await hub.validateMessage(decodedMessage);
            console.log(result,"result");
            if (!result.isOk() || !result.value.valid || !result.value.message) {
                throw new Error('Validation failed');
            } else {
                fid = result.value.message.data?.fid;
                console.log(fid,"fid")
                isValid = true; // Break out of the loop on success
            }
        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount >= maxRetries) {
                console.error("Max retries reached, failing with error.");
                break; // Exit loop after max retries
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
        }
    }
    return { fid, isValid };
};

export const getOwnerAddressFromFid = async (fid: number) => {
    let ownerAddress: `0x${string}` | undefined;
    try {
        const publicClient = createPublicClient({
            chain: optimism,
            transport: http(),
        });
        const idRegistry = getContract({
            address: ID_REGISTRY_CONTRACT_ADDRESS,
            abi: [
              {
                inputs: [{internalType: 'uint256', name: 'fid', type: 'uint256'}],
                name: 'custodyOf',
                outputs: [{internalType: 'address', name: 'owner', type: 'address'}],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            client: publicClient
        });
        ownerAddress = await idRegistry.read.custodyOf([BigInt(fid)]);
    } catch (error) {
        console.error(error);
    }
    return ownerAddress !== ZERO_ADDRESS ? ownerAddress : undefined;
}
