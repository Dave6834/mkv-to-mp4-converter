# MKV to MP4 Converter

A web application that converts MKV video files to MP4 format directly in the browser using FFmpeg.wasm.

## Features

- Browser-based conversion (no server required)
- Drag and drop interface
- Progress tracking
- Direct download of converted files

## Technologies Used

- Next.js
- React
- FFmpeg.wasm (WebAssembly port of FFmpeg)

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mkv-to-mp4-converter.git
cd mkv-to-mp4-converter
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This application can be easily deployed to Vercel:

```bash
npm install -g vercel
vercel
```

## License

MIT