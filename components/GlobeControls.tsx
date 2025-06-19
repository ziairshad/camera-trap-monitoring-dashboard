import React from 'react';

interface GlobeControlsProps {
  isRotating: boolean;
  onToggleRotation: () => void;
}

const GlobeControls: React.FC<GlobeControlsProps> = ({ isRotating, onToggleRotation }) => {
  return (
    <div className="absolute bottom-8 right-8 z-20">
      <button
        onClick={onToggleRotation}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 text-white shadow-lg backdrop-blur-md hover:bg-black/90 transition"
      >
        {isRotating ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 5.25v13.5m10.5-13.5v13.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25l13.5 6.75-13.5 6.75V5.25z" />
          </svg>
        )}
        <span className="text-sm font-medium">{isRotating ? 'Pause Globe' : 'Play Globe'}</span>
      </button>
    </div>
  );
};

export default GlobeControls; 