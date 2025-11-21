import React, { useState, useCallback, useEffect } from 'react';
import PromptEditor from './components/PromptEditor';
import AnalysisSidebar from './components/AnalysisSidebar';
import Widget from './components/Widget';
import { AnalysisResult, AnalysisStatus } from './types';
import { analyzePrompt } from './services/geminiService';

// Helper to detect if running in Electron
const isElectron = () => {
  return typeof (window as any).require === 'function';
};

const App: React.FC = () => {
  // -- SIMULATION STATE (For Browser Demo) --
  const [promptText, setPromptText] = useState<string>("");

  // -- APP STATE --
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRunningInElectron, setIsRunningInElectron] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // -- CARET TRACKING --
  const [caretPos, setCaretPos] = useState<{ x: number, y: number } | null>(null);
  const [activeProcessId, setActiveProcessId] = useState<number | null>(null);

  // Detect Environment
  useEffect(() => {
    const check = isElectron();
    console.log("[App]: Is Electron?", check);
    console.log("[App]: window.require?", typeof (window as any).require);
    setIsRunningInElectron(check);
  }, []);

  // Caret Tracking Effect
  useEffect(() => {
    if (isRunningInElectron) {
      try {
        const ipc = (window as any).require('electron').ipcRenderer;
        ipc.send('log', 'App mounted and IPC listener attaching...');

        const handleCaretUpdate = (_event: any, coords: { x: number, y: number, height: number, text?: string, processName?: string, processId?: number }) => {
          // Log to terminal via Main process
          // ipc.send('log', `Caret Update: ${JSON.stringify(coords)}`); 

          // DEBUG: Log process name to see what we are tracking
          if (coords.processName) {
            console.log("Tracking Process:", coords.processName);
          }

          // Store process ID for insert functionality
          if (coords.processId) {
            setActiveProcessId(coords.processId);
          }

          // Offset the widget slightly to the right of the caret
          setCaretPos({ x: coords.x + 20, y: coords.y + coords.height / 2 });

          if (coords.text) {
            setPromptText(coords.text);
          }
        };

        ipc.on('caret-position-update', handleCaretUpdate);

        return () => {
          ipc.removeListener('caret-position-update', handleCaretUpdate);
        };
      } catch (e) {
        console.error("Failed to access IPC", e);
      }
    }
  }, [isRunningInElectron]);

  // -- ELECTRON MOUSE HANDLING --
  const setIgnoreMouseEvents = (ignore: boolean) => {
    if (isRunningInElectron) {
      const ipc = (window as any).require('electron').ipcRenderer;
      ipc.send('set-ignore-mouse-events', ignore, { forward: true });
    }
  };

  const handleMouseEnterUI = () => {
    // When mouse is OVER the widget or sidebar, we want to CLICK it.
    // So we tell Electron: "Don't ignore mouse events" (ignore = false)
    setIgnoreMouseEvents(false);
  };

  const handleMouseLeaveUI = () => {
    // When mouse leaves the UI, let it pass through to the app behind.
    // Tell Electron: "Ignore mouse events" (ignore = true)
    setIgnoreMouseEvents(true);
  };

  const handleAnalyze = useCallback(async () => {
    // In Electron mode, we might want to grab text from clipboard or active window in the future.
    // For now, we rely on the simulation text or manual input.
    if (!promptText.trim()) return;

    setStatus(AnalysisStatus.LOADING);

    try {
      const analysisData = await analyzePrompt(promptText);
      setResult(analysisData);
      setStatus(AnalysisStatus.SUCCESS);
      setIsSidebarOpen(true);
    } catch (error: any) {
      console.error(error);
      // Log to terminal for debugging
      if (isRunningInElectron) {
        try {
          const ipc = (window as any).require('electron').ipcRenderer;
          ipc.send('log', `Analysis Failed: ${error.message || error.toString()}`);
          if (error.response) {
            ipc.send('log', `API Response: ${JSON.stringify(error.response)}`);
          }
        } catch (e) { /* ignore */ }
      }
      setStatus(AnalysisStatus.ERROR);
      setIsSidebarOpen(true);
    }
  }, [promptText, isRunningInElectron]);

  const handleApplyFix = async (fixedPrompt: string) => {
    console.log("[App] handleApplyFix called with:", fixedPrompt);
    try {
      await navigator.clipboard.writeText(fixedPrompt);
      console.log("[App] Copied to clipboard:", fixedPrompt);
    } catch (err) {
      console.error("[App] Failed to copy to clipboard:", err);
    }
  };

  const handleManualOpen = () => {
    setIsManualMode(true);
    setIsSidebarOpen(true);
  };

  const handleQuit = () => {
    if (isRunningInElectron) {
      try {
        const { remote } = (window as any).require('electron');
        remote.app.quit();
      } catch {
        window.close();
      }
    } else {
      window.close();
    }
  };

  const toggleSidebar = () => {
    if (status === AnalysisStatus.IDLE && promptText.trim().length > 0) {
      handleAnalyze();
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden flex items-center justify-center ${isRunningInElectron ? 'bg-transparent border-4 border-red-500 box-border' : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}
    >

      {/* 
        =============================================================================
        LAYER 1: SIMULATION LAYER 
        Only visible in Browser. Hidden in Electron (.exe) to show real desktop.
        =============================================================================
      */}
      {!isRunningInElectron && (
        <div className="w-[800px] h-[600px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-300 relative">
          <div className="bg-gray-100 h-10 border-b border-gray-300 flex items-center px-4 gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500"></div>
            </div>
            <span className="ml-4 text-xs text-gray-500 font-medium">Simulated App (Notepad) - Only visible in Browser</span>
          </div>
          <PromptEditor value={promptText} onChange={setPromptText} />
        </div>
      )}

      {/* 
        =============================================================================
        LAYER 2: OVERLAY LAYER (The "Promptly" App)
        This is the only thing visible in the .exe
        =============================================================================
      */}
      <div className="absolute inset-0 pointer-events-none z-50">

        {/* The Floating Widget */}
        <div
          className="absolute pointer-events-auto transition-all duration-100 ease-out"
          style={{
            top: isRunningInElectron && caretPos ? caretPos.y : '50%',
            left: isRunningInElectron && caretPos ? caretPos.x : '50%',
            transform: isRunningInElectron && caretPos ? 'translate(0, -50%)' : 'translate(320px, 220px)'
          }}
          onMouseEnter={handleMouseEnterUI}
          onMouseLeave={handleMouseLeaveUI}
        >
          <Widget
            status={status}
            score={result?.score}
            isVisible={true} // Always show for demo
            onClick={toggleSidebar}
            onManualOpen={handleManualOpen}
            onQuit={handleQuit}
          />
        </div>

        {/* The Sidebar */}
        <div
          className={`
            absolute top-4 right-4 bottom-4 w-[380px] 
            transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
            pointer-events-auto
            ${isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
          `}
          onMouseEnter={handleMouseEnterUI}
          onMouseLeave={handleMouseLeaveUI}
        >
          <div className="h-full w-full shadow-2xl rounded-2xl overflow-hidden border border-gray-200/50">
            <AnalysisSidebar
              status={status}
              result={result}
              onApplyFix={handleApplyFix}
              onClose={() => {
                setIsSidebarOpen(false);
                setIsManualMode(false);
              }}
              onReanalyze={handleAnalyze}
              isManualMode={isManualMode}
              onManualSubmit={(text) => {
                setPromptText(text);
                handleAnalyze();
                setIsManualMode(false);
              }}
            />
          </div>
        </div>

      </div>

      {/* Hint for the user (Browser only) */}
      {!isRunningInElectron && (
        <div className="absolute bottom-8 text-gray-500 text-xs font-medium">
          Browser Mode: Simulation Active. <br />
          Electron Mode: Background becomes transparent & click-through enabled.
        </div>
      )}

    </div>
  );
};

export default App;