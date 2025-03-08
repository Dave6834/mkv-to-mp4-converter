// components/VideoConverter.js
import { useState, useEffect, useRef } from 'react';
// Import specific versions
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// Don't initialize ffmpeg right away
let ffmpeg = null;

const VideoConverter = () => {
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [isFFmpegLoading, setIsFFmpegLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [inputFile, setInputFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [outputURL, setOutputURL] = useState('');
  const [conversionLog, setConversionLog] = useState([]);
  const dropzoneRef = useRef(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      if (isFFmpegLoaded || isFFmpegLoading) return;
      
      try {
        setIsFFmpegLoading(true);
        console.log('Creating FFmpeg instance...');
        
        // Create FFmpeg instance only when needed
        if (!ffmpeg) {
          ffmpeg = createFFmpeg({
            log: true,
            logger: ({ message }) => {
              console.log(message);
              setConversionLog(logs => [...logs, message]);
            },
            corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
          });
        }
        
        console.log('FFmpeg instance created, loading...');
        await ffmpeg.load();
        console.log('FFmpeg loaded successfully');
        setIsFFmpegLoaded(true);
        setIsFFmpegLoading(false);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setLoadingError(`Failed to load FFmpeg: ${error.message || 'Unknown error'}`);
        setIsFFmpegLoading(false);
      }
    };

    loadFFmpeg();
  }, [isFFmpegLoaded, isFFmpegLoading]);

  // Set up event listeners for drag and drop
  useEffect(() => {
    const dropzone = dropzoneRef.current;
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone?.classList.add('active');
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone?.classList.remove('active');
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone?.classList.remove('active');
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.mkv')) {
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
    if (file && file.name.toLowerCase().endsWith('.mkv')) {
      setInputFile(file);
    } else if (file) {
      alert('Please select an MKV file.');
    }
  };

  const convertToMP4 = async () => {
    if (!inputFile || !isFFmpegLoaded || !ffmpeg) return;

    try {
      setStatus('processing');
      setProgress(0);
      setConversionLog([]);
      
      // Register progress handler
      ffmpeg.setProgress(({ ratio }) => {
        setProgress(Math.max(0, Math.min(100, ratio * 100)));
      });

      // Create a safe filename without spaces or special characters
      const safeInFilename = inputFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const safeOutFilename = safeInFilename.replace(/\.mkv$/i, '.mp4');
      
      console.log(`Converting ${safeInFilename} to ${safeOutFilename}`);
      
      // Write the input file to memory
      setConversionLog(logs => [...logs, `Writing file to memory: ${safeInFilename}`]);
      ffmpeg.FS('writeFile', safeInFilename, await fetchFile(inputFile));
      
      // Run the FFmpeg command with verbose logging
      setConversionLog(logs => [...logs, 'Starting conversion process...']);
      await ffmpeg.run(
        '-i', safeInFilename,
        '-c:v', 'libx264',
        '-preset', 'fast',  // Use 'fast' preset for better performance
        '-crf', '22',       // Reasonable quality setting
        '-c:a', 'aac',
        '-b:a', '128k',     // Specify audio bitrate
        '-movflags', '+faststart',  // Optimize for web playback
        '-y',               // Overwrite output files without asking
        safeOutFilename
      );

      // Verify the file exists in the virtual filesystem
      setConversionLog(logs => [...logs, 'Checking if output file exists...']);
      const fileList = ffmpeg.FS('readdir', '/');
      console.log('Files in virtual filesystem:', fileList);
      
      if (!fileList.includes(safeOutFilename)) {
        throw new Error(`Output file ${safeOutFilename} not found in virtual filesystem`);
      }

      // Read the result
      setConversionLog(logs => [...logs, 'Reading output file...']);
      const data = ffmpeg.FS('readFile', safeOutFilename);
      
      console.log('Output file size:', data.length);
      if (data.length === 0) {
        throw new Error('Conversion produced an empty file');
      }
      
      // Create a URL
      setConversionLog(logs => [...logs, 'Creating download URL...']);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      );
      
      setOutputURL(url);
      setStatus('complete');
      
      // Clean up virtual filesystem to free memory
      ffmpeg.FS('unlink', safeInFilename);
      ffmpeg.FS('unlink', safeOutFilename);
    } catch (error) {
      console.error('Error during conversion:', error);
      setConversionLog(logs => [...logs, `ERROR: ${error.message}`]);
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!outputURL) return;
    
    const a = document.createElement('a');
    a.href = outputURL;
    a.download = inputFile.name.replace(/\.mkv$/i, '.mp4');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container">
      <h1>MKV to MP4 Converter</h1>
      <p>Convert your MKV video files to MP4 format right in your browser</p>
      
      {loadingError && (
        <div className="error-message">
          <p>Error: {loadingError}</p>
          <p>Try refreshing the page or using a different browser.</p>
        </div>
      )}
      
      {isFFmpegLoading ? (
        <div className="loading">
          <p>Loading FFmpeg (this may take a moment)...</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: '50%' }}></div>
          </div>
        </div>
      ) : !isFFmpegLoaded && !loadingError ? (
        <button onClick={() => setIsFFmpegLoading(true)}>
          Click to Load FFmpeg
        </button>
      ) : isFFmpegLoaded && (
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
            <div className="error-message">
              <p>An error occurred during conversion. Please try again with a smaller file or check browser console for details.</p>
            </div>
          )}

          <button 
            onClick={convertToMP4} 
            disabled={!inputFile || status === 'processing'}
          >
            {status === 'processing' ? 'Converting...' : 'Convert to MP4'}
          </button>
          
          {conversionLog.length > 0 && (
            <div className="log-container">
              <h3>Conversion Log</h3>
              <div className="log-messages">
                {conversionLog.map((log, index) => (
                  <div key={index} className="log-entry">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoConverter;