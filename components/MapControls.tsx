import React, { useState } from 'react';
import { Target, FileText, Info, Layers3, Eye, EyeOff } from 'lucide-react';

interface MapControlsProps {
  onToggleLayer: (layerId: string, visible: boolean) => void;
  onToggleReportSubfilter?: (subfilter: 'system' | 'legacy', visible: boolean) => void;
  onToggleRfiSubfilter?: (subfilter: 'high' | 'medium' | 'low', visible: boolean) => void;
  visibleLayers: {
    heatmap: boolean;
    rfi: boolean;
    reports: boolean;
    targets: boolean;
    layers: boolean;
  };
  reportSubfilters?: {
    system: boolean;
    legacy: boolean;
  };
  rfiSubfilters?: {
    high: boolean;
    medium: boolean;
    low: boolean;
  };
}

const MapControls: React.FC<MapControlsProps> = ({ 
  onToggleLayer, 
  onToggleReportSubfilter,
  onToggleRfiSubfilter,
  visibleLayers,
  reportSubfilters = { system: true, legacy: true },
  rfiSubfilters = { high: true, medium: true, low: true }
}) => {
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [showRfiDropdown, setShowRfiDropdown] = useState(false);
  
  const layerConfig = [
    {
      id: 'rfi',
      icon: Info,
      color: 'indigo',
      gradient: 'from-indigo-600/20 to-indigo-500/20',
      border: 'border-indigo-500/30',
      activeGlow: 'shadow-indigo-500/20'
    },
    {
      id: 'reports',
      icon: FileText,
      color: 'emerald',
      gradient: 'from-emerald-600/20 to-emerald-500/20',
      border: 'border-emerald-500/30',
      activeGlow: 'shadow-emerald-500/20'
    },
    {
      id: 'targets',
      icon: Target,
      color: 'amber',
      gradient: 'from-amber-600/20 to-amber-500/20',
      border: 'border-amber-500/30',
      activeGlow: 'shadow-amber-500/20'
    },
    {
      id: 'layers',
      icon: Layers3,
      color: 'cyan',
      gradient: 'from-cyan-600/20 to-cyan-500/20',
      border: 'border-cyan-500/30',
      activeGlow: 'shadow-cyan-500/20'
    }
  ];

  const allVisible = layerConfig.every(layer => visibleLayers[layer.id as keyof typeof visibleLayers]);

  const handleToggleAll = () => {
    const newState = !allVisible;
    layerConfig.forEach(layer => {
      onToggleLayer(layer.id, newState);
    });
  };

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 space-y-1">
        
        {/* Toggle All Button */}
        <div
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-all"
                  onClick={handleToggleAll}
        >
          <div className="flex items-center justify-center">
                  {allVisible ? (
              <EyeOff className="w-4 h-4 text-white" />
                  ) : (
              <Eye className="w-4 h-4 text-white/70" />
                  )}
              </div>
            </div>

        <div className="h-px bg-white/10 my-1" />

        {/* Layer Icons */}
        {layerConfig.map((layer) => {
                const isVisible = visibleLayers[layer.id as keyof typeof visibleLayers];
                const IconComponent = layer.icon;
                
                return (
            <div 
              key={layer.id} 
              className="relative"
              onMouseEnter={() => {
                if (layer.id === 'reports') {
                  setShowReportsDropdown(true);
                } else if (layer.id === 'rfi') {
                  setShowRfiDropdown(true);
                }
              }}
              onMouseLeave={() => {
                if (layer.id === 'reports') {
                  setShowReportsDropdown(false);
                } else if (layer.id === 'rfi') {
                  setShowRfiDropdown(false);
                }
              }}
            >
                    <div
                className={`relative p-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isVisible 
                          ? `bg-gradient-to-r ${layer.gradient} border ${layer.border} shadow-lg ${layer.activeGlow}` 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
                onClick={() => onToggleLayer(layer.id, !isVisible)}
                    >
                      {/* Animated Background Glow */}
                      {isVisible && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${layer.gradient} rounded-lg blur-sm opacity-30 animate-pulse`} />
                      )}
                      
                <div className="relative flex items-center justify-center">
                  <IconComponent className={`w-4 h-4 transition-colors duration-300 ${isVisible ? 'text-white' : 'text-white/60'}`} />
                              </div>
                          </div>
                          
              {/* Reports Dropdown - glassmorphism style */}
              {layer.id === 'reports' && showReportsDropdown && (
                <div 
                  className={`absolute top-0 right-full bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl p-1.5 min-w-[120px] animate-in fade-in-0 duration-200 ${
                    showReportsDropdown ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ zIndex: 99999 }}
                >
                  <div className="space-y-0.5">
                    {[
                      { id: 'system', label: 'System' },
                      { id: 'legacy', label: 'Legacy' }
                    ].map((subfilter) => {
                      const isActive = reportSubfilters[subfilter.id as keyof typeof reportSubfilters];
                      
                      return (
                        <div 
                          key={subfilter.id}
                          className={`flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md transition-all duration-200 ${
                            isActive 
                              ? 'bg-emerald-500/20 backdrop-blur-sm text-emerald-400 border border-emerald-500/30' 
                              : 'hover:bg-white/10 hover:backdrop-blur-sm hover:text-white border border-transparent'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleReportSubfilter?.(subfilter.id as 'system' | 'legacy', !isActive);
                          }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-white/40'}`} />
                          
                          <span className="font-medium leading-none">{subfilter.label}</span>
                          
                          {isActive && (
                            <div className="w-2.5 h-2.5 bg-emerald-400 rounded border border-emerald-400 flex-shrink-0 ml-auto" />
                          )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

              {/* RFI Dropdown - glassmorphism style */}
              {layer.id === 'rfi' && showRfiDropdown && (
                <div 
                  className={`absolute top-0 right-full bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl p-1.5 min-w-[120px] animate-in fade-in-0 duration-200 ${
                    showRfiDropdown ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ zIndex: 99999 }}
                >
                  <div className="space-y-0.5">
                    {[
                      { id: 'high', label: 'High' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'low', label: 'Low' }
                    ].map((subfilter) => {
                      const isActive = rfiSubfilters[subfilter.id as keyof typeof rfiSubfilters];
                      
                      return (
                        <div 
                          key={subfilter.id}
                          className={`flex items-center gap-2 text-xs cursor-pointer py-1.5 px-1.5 rounded-md transition-all duration-200 ${
                            isActive 
                              ? 'bg-indigo-500/20 backdrop-blur-sm text-indigo-400 border border-indigo-500/30' 
                              : 'hover:bg-white/10 hover:backdrop-blur-sm hover:text-white border border-transparent'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleRfiSubfilter?.(subfilter.id as 'high' | 'medium' | 'low', !isActive);
                          }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-indigo-400' : 'bg-white/40'}`} />
                          
                          <span className="font-medium leading-none">{subfilter.label}</span>
                          
                          {isActive && (
                            <div className="w-2.5 h-2.5 bg-indigo-400 rounded border border-indigo-400 flex-shrink-0 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                  </div>
                );
              })}
      </div>
    </div>
  );
};

export default MapControls; 