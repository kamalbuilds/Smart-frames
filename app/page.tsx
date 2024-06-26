import {getFrameMetadata} from '@coinbase/onchainkit';
import type {Metadata} from 'next';
import {FrameImageUrls, FRAME_BASE_URL} from '../lib/farcaster';
import RedirectToDemo from '@/components/redirect';

const frameMetadata = getFrameMetadata({
  buttons: [
    'Privy',
    'Dynamic Embedded Wallet',
],
  image: FrameImageUrls.CHOICE,
  post_url: `${FRAME_BASE_URL}/api/choice`,
});

export const metadata: Metadata = {
  title: 'Smart Frames',
  description: 'Smart Frames',
  openGraph: {
    title: 'Smart Frames',
    description: 'Empowering Developers with Rapid AA Frame Development for Onchain Transactions',
    images: [FrameImageUrls.CHOICE],
  },
  other: {
    ...frameMetadata,
  },
};


export default function Page() {
  return (
    <>
      <h1>Smart Frames</h1>
      <h3>Empowering Developers with Rapid AA Frame Development for Onchain Transactions</h3>
      <RedirectToDemo />
    </>);
}