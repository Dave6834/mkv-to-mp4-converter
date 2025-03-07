// pages/index.js
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Import TestComponent dynamically with SSR disabled
const TestComponent = dynamic(
  () => import('../components/TestComponent'),
  { ssr: false }
);

// Import VideoConverter dynamically with SSR disabled
const VideoConverter = dynamic(
  () => import('../components/VideoConverter'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="app-container">
      <Head>
        <title>MKV to MP4 Converter</title>
        <meta name="description" content="Convert MKV videos to MP4 format in your browser" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main-content">
        <TestComponent />
        <VideoConverter />
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} MKV to MP4 Converter</p>
      </footer>
    </div>
  );
}