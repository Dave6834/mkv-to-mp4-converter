// components/TestComponent.js
import React, { useEffect, useState } from 'react';

const TestComponent = () => {
  const [status, setStatus] = useState('Loading...');
  
  useEffect(() => {
    const testFFmpeg = async () => {
      try {
        // Import dynamically to avoid SSR issues
        const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
        
        if (typeof createFFmpeg === 'function') {
          setStatus('FFmpeg module loaded successfully! createFFmpeg is a function.');
        } else {
          setStatus(`FFmpeg module loaded but createFFmpeg is not a function. Type: ${typeof createFFmpeg}`);
        }
      } catch (error) {
        setStatus(`Error loading FFmpeg: ${error.message}`);
        console.error('Error loading FFmpeg:', error);
      }
    };
    
    testFFmpeg();
  }, []);
  
  return (
    <div className="test-container">
      <h2>FFmpeg Test</h2>
      <p>{status}</p>
    </div>
  );
};

export default TestComponent;