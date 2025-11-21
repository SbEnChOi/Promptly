import React, { useState } from 'react';
import { SidebarProps, AnalysisStatus } from '../types';
import ScoreGauge from './ScoreGauge';
import { CheckCircle2, XCircle, Lightbulb, Copy, Sparkles, X, ArrowRight, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface ExtendedSidebarProps extends SidebarProps {
  onClose: () => void;
  onReanalyze: () => void;
  isManualMode?: boolean;
  onManualSubmit?: (text: string) => void;
}

const AnalysisSidebar: React.FC<ExtendedSidebarProps> = ({ status, result, onApplyFix, onClose, onReanalyze, isManualMode, onManualSubmit }) => {
  const [manualText, setManualText] = useState("");

  // Header designed to look like a native app title bar
  const Header = () => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 rounded-t-2xl">
      <div className="flex items-center gap-2 text-indigo-600">
        <div className="bg-indigo-100 p-1.5 rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm tracking-wide text-gray-800">Promptly</span>
      </div>
      <div className="flex items-center gap-1">
        {status === AnalysisStatus.SUCCESS && (
          <button
            onClick={onReanalyze}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Re-analyze"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const [selectedLang, setSelectedLang] = useState<'ko' | 'en'>('ko');
  const [englishTranslation, setEnglishTranslation] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load translation service
  const handleTranslate = async () => {
    if (englishTranslation || !result) return; // Already translated or no result

    setIsTranslating(true);
    try {
      const { translateToEnglish } = await import('../services/translationService');
      const translated = await translateToEnglish(result.optimizedPrompt);
      setEnglishTranslation(translated);
      setSelectedLang('en');
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageToggle = (lang: 'ko' | 'en') => {
    if (lang === 'en' && !englishTranslation && !isTranslating) {
      handleTranslate();
    } else {
      setSelectedLang(lang);
    }
  };

  // IDLE State or Manual Mode
  if (status === AnalysisStatus.IDLE || isManualMode) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden">
        <Header />
        <div className="flex-1 flex flex-col p-6 gap-4">
          {isManualMode ? (
            <>
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-lg font-bold">Manual Prompt Input</h2>
              </div>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Enter your prompt here..."
                className="flex-1 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
              />
              <button
                onClick={() => onManualSubmit?.(manualText)}
                disabled={!manualText.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Analyze Prompt
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No analysis yet
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading State
  if (status === AnalysisStatus.LOADING) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium animate-pulse">Analyzing your prompt...</p>
          <p className="text-xs text-gray-400 mt-2">Checking clarity, tone, and structure</p>
        </div>
      </div>
    );
  }

  // Error State
  if (status === AnalysisStatus.ERROR) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-800 font-bold mb-2">Analysis Failed</p>
          <p className="text-sm text-gray-500 mb-6">We couldn't process your prompt.<br />Try Again</p>
          <button
            onClick={onReanalyze}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentOptimizedPrompt = selectedLang === 'ko'
    ? result?.optimizedPrompt || ""
    : englishTranslation || result?.optimizedPrompt || "";

  // Results State
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
      <Header />

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        {/* Score Card */}
        {result && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <ScoreGauge score={result.score} />
          </div>
        )}

        {/* Actionable Fix */}
        {result && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-gray-800 text-sm">Suggested Rewrite</h3>
              </div>
              {/* Language Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => handleLanguageToggle('ko')}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${selectedLang === 'ko' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  KR
                </button>
                <button
                  onClick={() => handleLanguageToggle('en')}
                  disabled={isTranslating}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${selectedLang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'} ${isTranslating ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isTranslating ? '...' : 'EN'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden group">
              <div className="p-4 text-sm text-gray-700 leading-relaxed bg-gradient-to-b from-white to-indigo-50/30">
                {currentOptimizedPrompt}
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => {
                    console.log("[Sidebar]: Copy button clicked!");
                    onApplyFix(currentOptimizedPrompt);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
                  }}
                  className={`flex items-center gap-2 font-bold text-sm transition-all active:scale-95 ${copied
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-indigo-600 hover:text-indigo-700'
                    }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 animate-in zoom-in duration-200" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details List */}
        {result && (
          <div className="space-y-6 pb-6">
            {/* Good */}
            {result.strengths.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="flex items-center gap-2 font-bold text-gray-800 text-xs uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Strengths
                </h4>
                <ul className="space-y-3">
                  {result.strengths.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-3">
                      <div className="w-1 h-1 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {result.weaknesses.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="flex items-center gap-2 font-bold text-gray-800 text-xs uppercase tracking-wider mb-3 border-b border-gray-50 pb-2">
                  <XCircle className="w-4 h-4 text-red-500" /> Issues Found
                </h4>
                <ul className="space-y-3">
                  {result.weaknesses.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-3">
                      <div className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisSidebar;