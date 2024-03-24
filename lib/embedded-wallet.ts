
import axios, { AxiosRequestConfig } from 'axios';
import { NextResponse } from 'next/server';
import { ChainEnum } from '@dynamic-labs/sdk-api';

const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const PRIVY_API_URL = process.env.PRIVY_API_URL || 'https://auth.privy.io/api/v1';


// Dynamic.xyz configuration
const DYNAMIC_ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;
const DYNAMIC_KEY = process.env.KEY;

// Config for axios or fetch headers for Dynamic
const dynamicConfig = {
    method: "POST",
    headers: {
        'Authorization': `Bearer ${DYNAMIC_KEY}`,
        'Content-Type': 'application/json',
    },
};

const config: AxiosRequestConfig = {
    headers: {
        'privy-app-id': PRIVY_APP_ID,
        Authorization: `Basic ${btoa(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`)}`
    }
}

export const createOrFindEmbeddedWalletForFid = async (fid: number, ownerAddress: string , walletProvider: string, email? : string) => {
    console.log("here");
    let newWalletAddresses: string[] = [];

    switch (walletProvider) {
        case 'privy':
            const {address, conflictingDid}  = await createEmbeddedWalletForFid(fid, ownerAddress);

            console.log(address,"address");
            if (address) newWalletAddresses.push(address);

            // If no conflicting DID was found for the user, it is an unrecoverable error
            if (!conflictingDid) return undefined;
        
            // If a conflicting DID was found, check if they have an embedded wallet already
            const existingAddress = await findExistingEmbeddedWalletForDid(conflictingDid);
            if (existingAddress) return existingAddress;
        
            // If no existing embedded wallet, delete the user and recreate it with an embedded wallet
            const newAddress = await deleteAndCreateUserWithEmbeddedWallet(conflictingDid, fid, ownerAddress);
            if (newAddress) newWalletAddresses.push(newAddress);

            break;

        case 'dynamic':
            // Dynamic.xyz wallet creation logic
            console.log("Creating embedded wallets for", email, fid);
            const dynamicWalletCreationUrl = `https://app.dynamicauth.com/api/v0/environments/${DYNAMIC_ENVIRONMENT_ID}/embeddedWallets/farcaster`;
            try {
                const response = await fetch(dynamicWalletCreationUrl, {
                    ...dynamicConfig,
                    body: JSON.stringify({
                        email,
                        fid,
                        chains: [ChainEnum.Sol, ChainEnum.Evm],
                    }),
                });
                const data = await response.json();
                console.log(data,"data")
                // @ts-ignore
                newWalletAddresses = data.user.wallets.map( (wallet: any) => wallet.publicKey);
            } catch (error) {
                console.error("Dynamic.xyz wallet creation failed:", error);
                throw error;
            }
            break;

        default:
            throw new Error("Invalid wallet provider selected");
    }

    console.log(newWalletAddresses, "newWalletAddresses");
    return newWalletAddresses;
}

const createEmbeddedWalletForFid = async (fid: number, ownerAddress: string) => {
    let embeddedWalletAddress: `0x${string}` | undefined;
    let conflictingDid: string | undefined;
    const proposedUser = {
        'create_embedded_wallet': true,
        'linked_accounts': [
            {
                'type': 'farcaster',
                'fid': fid,
                'owner_address': ownerAddress
            }
        ]
    }

    try {
        const response = await axios.post(`${PRIVY_API_URL}/users`, proposedUser, config); 
        const linkedAccounts = response.data.linked_accounts;
        conflictingDid = response.data.id;
        const embeddedWallet = linkedAccounts.find((account: any) => (account.type === 'wallet'));
        embeddedWalletAddress = embeddedWallet ? embeddedWallet.address : undefined;
    } catch (e) {
        conflictingDid = (e as any).response.data.cause;
    }

    return {address: embeddedWalletAddress, conflictingDid: conflictingDid};
}

export const findExistingEmbeddedWalletForDid = async (did: string) => {
    try {
        const response = await axios.get(`${PRIVY_API_URL}/users/${did}`, config);
        const linkedAccounts = response.data.linked_accounts;
        const embeddedWallet = linkedAccounts.find((account: any) => (account.type === 'wallet'));
        return embeddedWallet ? embeddedWallet.address : undefined;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

const deleteAndCreateUserWithEmbeddedWallet = async (did: string, fid: number, ownerAddress: string) => {
    try {
        await axios.delete(`${PRIVY_API_URL}/users/${did}`, config);
    } catch (error) {
        // Unable to delete user
        return undefined;
    }

    // Will not try to delete again
    const {address} = await createEmbeddedWalletForFid(fid, ownerAddress);
    return address;
}