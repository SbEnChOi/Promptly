import React from 'react';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  // Determine color based on score
  let color = "text-red-500";
  let bgColor = "bg-red-100";
  if (score >= 80) {
    color = "text-green-500";
    bgColor = "bg-green-100";
  } else if (score >= 50) {
    color = "text-yellow-500";
    bgColor = "bg-yellow-100";
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
          <circle
            className={`${color} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
        </svg>
        <span className={`absolute text-xl font-bold ${color}`}>{score}</span>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-800">Prompt Quality</h3>
        <div className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${bgColor} ${color.replace('text-', 'text-opacity-90 text-')}`}>
          {score >= 80 ? "Excellent" : score >= 50 ? "Needs Improvement" : "Weak"}
        </div>
      </div>
    </div>
  );
};

export default ScoreGauge;
