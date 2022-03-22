import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Background from './components/Background';
import Footer from './components/Footer';
import domtoimage from 'dom-to-image';
import { createGIF } from 'gifshot';
import './App.css';

const SCALE = 1.9;

function base64toBlobURL(base64ImageData) {
  const contentType = 'image/png';
  const byteCharacters = atob(base64ImageData.substr(`data:${contentType};base64,`.length));
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, {type: contentType});
  const blobUrl = URL.createObjectURL(blob);
  return blobUrl;
}

const downloadBlob = (blob, filename) => {
  let element = document.createElement('a');
  element.setAttribute('href', blob);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function App() {
  const backgroundRef = useRef(null);
  // This needs refactoring
  const [padding, setPadding] = useState(42);
  const [colors, setColors] = useState('One Dark');
  const [language, setLanguage] = useState('JavaScript');
  const [backgroundColor, setBackgroundColor] = useState(2);
  const [exporting, setExporting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [exportingGIF, setExportingGIF] = useState(false);
  const [currentFrameToCapture, setCurrentFrameToCapture] = useState(0);
  const [frames, setFrames] = useState([]);
  const [gifFrames, setGIFFrames] = useState([]);
  const [editorState, setEditorState] = useState({ text: '// Type your code here', row: 0, column: 0 });
  const [allGIFFramesCaptured, setAllGIFFramesCaptured] = useState(false);
  const [singleFrameProcessing, setSingleFrameProcessing] = useState(false);

  // When recording each editor state
  useEffect(() => {
    if (recording) {
      setFrames(prev => [...prev, { ...editorState }]);
    }
  }, [recording, editorState]);

  useEffect(() => {
    if (exportingGIF && !singleFrameProcessing) {
      if (currentFrameToCapture === (frames.length-1)) {
        setExportingGIF(false);
        setAllGIFFramesCaptured(true);
        setCurrentFrameToCapture(0);
      } else {
        setCurrentFrameToCapture(prev => prev +1);
      }
    }
  }, [exportingGIF, singleFrameProcessing, currentFrameToCapture])

  useEffect(() => {
    if(exportingGIF && !singleFrameProcessing) {
      setEditorState(frames[currentFrameToCapture])
    }
  }, [exportingGIF, currentFrameToCapture, frames, singleFrameProcessing])

  useEffect(() => {
     if (exportingGIF && !singleFrameProcessing) {
      setSingleFrameProcessing(true);

      takeSnapshot()
        .then(imageBlob => {
          setGIFFrames(prev => [...prev, imageBlob]);
          setSingleFrameProcessing(false);
        });
    }
  }, [exportingGIF, editorState, frames, singleFrameProcessing]);

  useEffect(() => {
    if (allGIFFramesCaptured && (gifFrames.length === frames.length)) {
      const width = backgroundRef.current.offsetWidth * SCALE;
      const height = backgroundRef.current.offsetHeight * SCALE;
      console.log({ gifFrames });
      const framesToExport = [...gifFrames];
      for (let _ of [1,2,3,4,5,6,7,8]) {
        framesToExport.push(gifFrames[gifFrames.length-1]);
      }
      createGIF({ images: framesToExport, gifWidth: width, gifHeight: height, sampleInterval: 1 }, (obj) => {
        if (!obj.error) {
          downloadBlob(obj.image, 'recoded.gif');
        }
        setAllGIFFramesCaptured(false);
        setGIFFrames([]);
        setFrames([]);
      });
    }
  }, [allGIFFramesCaptured, gifFrames, frames]);

  const takeSnapshot = async () => {
    const node = backgroundRef.current;

    const style = {
      transform: 'scale('+SCALE+')',
      transformOrigin: 'top left',
      width: node.offsetWidth + "px",
      height: node.offsetHeight + "px",
    }

    const param = {
      height: node.offsetHeight * SCALE,
      width: node.offsetWidth * SCALE,
      quality: 1,
      style
    }

    const base64Image = await domtoimage.toPng(node, param)
    return base64toBlobURL(base64Image)
  }

  const onExport = () => {
    setExporting(true);

    setTimeout(() => {
      takeSnapshot()
        .then(blobUrl => {
          downloadBlob(blobUrl, 'recoded.png');
        })
        .catch(error => {
          console.log("Error: "+error);
        })
        .finally(() => setExporting(false));
    }, 100);
  }

  const onRecord = () => {
    if (recording) {
      setRecording(false);
      setExportingGIF(true);
      return;
    }

    setFrames([]);
    setRecording(true);
  }

  return (
    <>
      <Header
        padding={padding} setPadding={setPadding}
        colors={colors} setColors={setColors}
        language={language} setLanguage={setLanguage}
        backgroundColor={backgroundColor} setBackgroundColor={setBackgroundColor}
        exportingGIF={exportingGIF}
        allGIFFramesCaptured={allGIFFramesCaptured}
        recording={recording}
        onExport={onExport}
        onRecord={onRecord}
      />
      <div className="center">
      <Background
        ref={backgroundRef}
        backgroundColor={backgroundColor}
        padding={padding}
        colors={colors}
        language={language}
        exporting={exporting}
        exportingGIF={exportingGIF || allGIFFramesCaptured}
        editorState={editorState}
        setEditorState={setEditorState}
      />
      </div>
      <Footer />
    </>
  );
}

export default App;
