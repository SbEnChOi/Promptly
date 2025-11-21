import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Power, PenSquare } from 'lucide-react';
import { AnalysisStatus } from '../types';

interface WidgetProps {
  status: AnalysisStatus;
  score?: number;
  onClick: () => void;
  onManualOpen?: () => void;
  onQuit?: () => void;
  isVisible: boolean;
}

const Widget: React.FC<WidgetProps> = ({ status, score, onClick, onManualOpen, onQuit, isVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  if (!isVisible) return null;

  // Determine visual state based on status and score
  let containerClasses = "bg-white border-gray-200";
  let iconColor = "text-indigo-600";
  let shadowColor = "shadow-indigo-500/30";

  if (status === AnalysisStatus.LOADING) {
    containerClasses = "bg-white border-indigo-500";
    iconColor = "text-indigo-600";
    shadowColor = "shadow-indigo-500/50";
  } else if (status === AnalysisStatus.SUCCESS && score !== undefined) {
    if (score >= 80) {
      containerClasses = "bg-gradient-to-br from-green-400 to-emerald-600 border-transparent";
      iconColor = "text-white";
      shadowColor = "shadow-green-500/50";
    } else if (score >= 50) {
      containerClasses = "bg-gradient-to-br from-yellow-400 to-orange-500 border-transparent";
      iconColor = "text-white";
      shadowColor = "shadow-orange-500/50";
    } else {
      containerClasses = "bg-gradient-to-br from-red-500 to-pink-600 border-transparent";
      iconColor = "text-white";
      shadowColor = "shadow-red-500/50";
    }
  } else {
    // Idle but ready - Premium Gradient
    containerClasses = "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-transparent";
    iconColor = "text-white";
    shadowColor = "shadow-purple-500/40";
  }

  const handleMouseEnter = () => {
    // start loading animation
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsExpanded(true);
      // stop loading animation once expanded
      setIsLoading(false);
    }, 1000);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    setIsExpanded(false);
    // reset loading state for next hover
    setIsLoading(false);
  };

  // Render loading circle only when not expanded
  const renderLoadingCircle = isLoading && !isExpanded && (
    <svg
      className="absolute -inset-2 w-14 h-14 -rotate-90 pointer-events-none"
    >
      <circle
        cx="28"
        cy="28"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-indigo-400"
        style={{
          strokeDasharray: 151,
          strokeDashoffset: 0,
          transition: 'stroke-dashoffset 1s linear',
        }}
      />
    </svg>
  );

  return (
    <div
      className="relative flex items-center gap-3"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${shadowColor} ${status === AnalysisStatus.IDLE ? 'animate-pulse' : ''}`}></div>

      {/* Power Button (Left) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuit?.();
        }}
        className={`
          relative flex items-center justify-center w-8 h-8 rounded-full
          bg-gradient-to-br from-red-500 to-red-600 border-2 border-transparent
          shadow-lg shadow-red-500/40
          transition-all duration-300 ease-out
          ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
        `}
      >
        <Power className="w-4 h-4 text-white" strokeWidth={2.5} />
      </button>

      {/* Main Widget Button (Center) */}
      <div className="relative">
        {/* Circular Loading Progress - positioned outside button */}
        <svg
          className="absolute -inset-2 w-14 h-14 -rotate-90 pointer-events-none"
        >
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-indigo-400"
            style={{
              strokeDasharray: 151,
              strokeDashoffset: isLoading ? 0 : 151,
              transition: 'stroke-dashoffset 1s linear'
            }}
          />
        </svg>

        <button
          onClick={onClick}
          className={`
            relative flex items-center justify-center w-10 h-10 rounded-full
            border-2 ${containerClasses} shadow-lg ${shadowColor}
            transition-all duration-300 ease-out
            transform hover:scale-110 hover:rotate-3 active:scale-95
            z-50 overflow-hidden
          `}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300 rounded-full"></div>

          {status === AnalysisStatus.LOADING ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
          ) : status === AnalysisStatus.SUCCESS && score !== undefined ? (
            <span className={`font-bold text-xs ${iconColor} drop-shadow-md`}>{score}</span>
          ) : (
            <Sparkles className={`w-5 h-5 ${iconColor} drop-shadow-sm`} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Manual Input Button (Right) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onManualOpen?.();
        }}
        className={`
          relative flex items-center justify-center w-8 h-8 rounded-full
          bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-transparent
          shadow-lg shadow-blue-500/40
          transition-all duration-300 ease-out
          transform hover:scale-110 active:scale-95
          z-50
          ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
        `}
      >
        <PenSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Widget;