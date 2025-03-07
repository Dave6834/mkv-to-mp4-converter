// pages/index.js
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Import VideoConverter dynamically with SSR disabled
// This is necessary because FFmpeg.wasm needs browser APIs
const VideoConverter = dynamic(
  () => import('../components/VideoConverter'),
  { ssr: false }
);

export default function Home() {
  return (
    <div>
      <Head>
        <title>MKV to MP4 Converter</title>
        <meta name="description" content="Convert MKV videos to MP4 format in your browser" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <VideoConverter />
      </main>

      <footer>
        <p>© {new Date().getFullYear()} MKV to MP4 Converter</p>
      </footer>
    </div>
  );
}