// components/VideoConverter.js
import { useState, useEffect, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
});

const VideoConverter = () => {
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [inputFile, setInputFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [outputURL, setOutputURL] = useState('');
  const dropzoneRef = useRef(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg.isLoaded()) {
          await ffmpeg.load();
          setIsFFmpegLoaded(true);
          console.log('FFmpeg loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
      }
    };

    loadFFmpeg();
  }, []);

  // Set up event listeners for drag and drop
  useEffect(() => {
    const dropzone = dropzoneRef.current;
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('active');
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('active');
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('active');
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.mkv')) {
          setInputFile(file);
        } else {
          alert('Please select an MKV file.');
        }
      }
    };
    
    if (dropzone) {
      dropzone.addEventListener('dragover', handleDragOver);
      dropzone.addEventListener('dragleave', handleDragLeave);
      dropzone.addEventListener('drop', handleDrop);
      
      return () => {
        dropzone.removeEventListener('dragover', handleDragOver);
        dropzone.removeEventListener('dragleave', handleDragLeave);
        dropzone.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.mkv')) {
      setInputFile(file);
    } else {
      alert('Please select an MKV file.');
    }
  };

  const convertToMP4 = async () => {
    if (!inputFile || !isFFmpegLoaded) return;

    try {
      setStatus('processing');
      setProgress(0);
      
      // Register progress handler
      ffmpeg.setProgress(({ ratio }) => {
        setProgress(ratio * 100);
      });

      // Write the input file to memory
      ffmpeg.FS('writeFile', inputFile.name, await fetchFile(inputFile));

      // Get the output filename (replace .mkv with .mp4)
      const outputFilename = inputFile.name.replace('.mkv', '.mp4');

      // Run the FFmpeg command
      await ffmpeg.run(
        '-i', inputFile.name,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-strict', 'experimental',
        outputFilename
      );

      // Read the result
      const data = ffmpeg.FS('readFile', outputFilename);
      
      // Create a URL
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      );
      
      setOutputURL(url);
      setStatus('complete');
    } catch (error) {
      console.error('Error during conversion:', error);
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!outputURL) return;
    
    const a = document.createElement('a');
    a.href = outputURL;
    a.download = inputFile.name.replace('.mkv', '.mp4');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container">
      <h1>MKV to MP4 Converter</h1>
      <p>Convert your MKV video files to MP4 format right in your browser</p>
      
      {!isFFmpegLoaded ? (
        <p>Loading FFmpeg (this may take a moment)...</p>
      ) : (
        <>
          <div 
            className="dropzone" 
            ref={dropzoneRef}
            onClick={() => document.getElementById('file-input').click()}
          >
            {inputFile ? (
              <p>Selected file: {inputFile.name}</p>
            ) : (
              <p>Drag & drop an MKV file here, or click to select</p>
            )}
            <input
              id="file-input"
              type="file"
              accept=".mkv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {inputFile && (
            <div className="file-info">
              <p>Filename: {inputFile.name}</p>
              <p>Size: {(inputFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-container">
              <p>Converting... {progress.toFixed(2)}%</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="result">
              <p>Conversion complete!</p>
              <button onClick={handleDownload}>Download MP4</button>
            </div>
          )}

          {status === 'error' && (
            <p className="error">An error occurred during conversion. Please try again.</p>
          )}

          <button 
            onClick={convertToMP4} 
            disabled={!inputFile || status === 'processing'}
          >
            {status === 'processing' ? 'Converting...' : 'Convert to MP4'}
          </button>
        </>
      )}
    </div>
  );
};

export default VideoConverter;