import {getFrameMetadata} from '@coinbase/onchainkit';
import type {Metadata} from 'next';
import {FrameImageUrls, FRAME_BASE_URL} from '../../lib/farcaster';
import RedirectToDemo from '@/components/redirect';

const frameMetadata = getFrameMetadata({
  buttons: ['Create a wallet'],
  image: FrameImageUrls.START,
  post_url: `${FRAME_BASE_URL}/api/wallet`,
});

export const metadata: Metadata = {
  title: 'Smart Frames',
  description: 'Smart Frames',
  openGraph: {
    title: 'Smart Frames',
    description: 'Empowering Developers with Rapid AA Frame Development for Onchain Transactions',
    images: [FrameImageUrls.START],
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