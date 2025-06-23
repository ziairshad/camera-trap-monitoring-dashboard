import React, { useState } from 'react';
import { Activity, Zap, Target, FileText, Info, Shield, Layers3, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';

interface MapControlsProps {
  onToggleLayer: (layerId: string, visible: boolean) => void;
  onToggleReportSubfilter?: (subfilter: 'system' | 'legacy', visible: boolean) => void;
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
}

const MapControls: React.FC<MapControlsProps> = ({ 
  onToggleLayer, 
  onToggleReportSubfilter,
  visibleLayers,
  reportSubfilters = { system: true, legacy: true }
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  
  const layerConfig = [
    {
      id: 'heatmap',
      label: 'Heat Map',
      icon: Activity,
      color: 'slate',
      description: 'Activity density visualization',
      gradient: 'from-slate-600/15 to-slate-500/15',
      border: 'border-slate-500/20',
      glow: 'shadow-slate-500/10',
      activeGlow: 'shadow-slate-500/20',
      toggle: 'bg-gradient-to-r from-slate-600 to-slate-500'
    },
    {
      id: 'rfi',
      label: 'RFIs',
      icon: Info,
      color: 'indigo',
      description: 'Request for Information',
      gradient: 'from-indigo-600/15 to-indigo-500/15',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/10',
      activeGlow: 'shadow-indigo-500/20',
      toggle: 'bg-gradient-to-r from-indigo-600 to-indigo-500'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      color: 'emerald',
      description: 'Intelligence reports',
      gradient: 'from-emerald-600/15 to-emerald-500/15',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/10',
      activeGlow: 'shadow-emerald-500/20',
      toggle: 'bg-gradient-to-r from-emerald-600 to-emerald-500'
    },
    {
      id: 'targets',
      label: 'Targets',
      icon: Target,
      color: 'amber',
      description: 'Strategic targets',
      gradient: 'from-amber-600/15 to-amber-500/15',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/10',
      activeGlow: 'shadow-amber-500/20',
      toggle: 'bg-gradient-to-r from-amber-600 to-amber-500'
    },
    {
      id: 'layers',
      label: 'Images',
      icon: Layers3,
      color: 'cyan',
      description: 'Image footprints',
      gradient: 'from-cyan-600/15 to-cyan-500/15',
      border: 'border-cyan-500/20',
      glow: 'shadow-cyan-500/10',
      activeGlow: 'shadow-cyan-500/20',
      toggle: 'bg-gradient-to-r from-cyan-600 to-cyan-500'
    }
  ];

  // Calculate if all layers are visible (excluding heatmap)
  const visibleLayersExcludingHeatmap = Object.entries(visibleLayers).filter(([key]) => key !== 'heatmap');
  const allVisible = visibleLayersExcludingHeatmap.every(([, value]) => value);
  const someVisible = visibleLayersExcludingHeatmap.some(([, value]) => value);

  // Toggle all layers function (excluding heatmap)
  const handleToggleAll = () => {
    const newState = !allVisible;
    layerConfig.filter(layer => layer.id !== 'heatmap').forEach(layer => {
      onToggleLayer(layer.id, newState);
    });
  };

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
      {/* Container that moves together */}
      <div className={`flex items-center transition-all duration-500 ease-in-out transform ${isCollapsed ? 'translate-x-[calc(100%-3rem)]' : 'translate-x-0'}`}>
        {/* Toggle Arrow Button - moves with the panel but stays visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mr-2 h-10 w-10 p-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl hover:bg-black/60 transition-all duration-300 text-white hover:scale-105 flex-shrink-0"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>

        {/* Main Panel */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-600/8 to-slate-500/8 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/10 rounded-lg">
                    <Layers3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Map Layers</h3>
                    <p className="text-xs text-white/60">Control visualization</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleAll}
                  className="h-8 px-2 text-white hover:bg-white/10 transition-colors"
                >
                  {allVisible ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span className="ml-1 text-xs hidden sm:inline-block">
                    {allVisible ? 'Hide All' : 'Show All'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Layer Controls */}
            <div className="p-3 space-y-2">
              {layerConfig.filter(layer => layer.id !== 'heatmap').map((layer) => {
                const isVisible = visibleLayers[layer.id as keyof typeof visibleLayers];
                const IconComponent = layer.icon;
                
                return (
                  <div key={layer.id}>
                    {/* Main Layer Control */}
                    <div
                      className={`group relative p-3 rounded-lg transition-all duration-300 cursor-pointer
                        ${isVisible 
                          ? `bg-gradient-to-r ${layer.gradient} border ${layer.border} shadow-lg ${layer.activeGlow}` 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }
                        hover:scale-[1.01] hover:shadow-lg`}
                      onClick={(e) => {
                        if (layer.id === 'reports' && e.target === e.currentTarget) {
                          setIsReportsExpanded(!isReportsExpanded);
                        } else {
                          onToggleLayer(layer.id, !isVisible);
                        }
                      }}
                    >
                      {/* Animated Background Glow */}
                      {isVisible && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${layer.gradient} rounded-xl blur-sm opacity-30 animate-pulse`} />
                      )}
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* Icon with glow effect */}
                          <div className={`relative p-1.5 rounded-md transition-all duration-300
                            ${isVisible 
                              ? `bg-gradient-to-r ${layer.toggle} shadow-lg ${layer.activeGlow}` 
                              : 'bg-white/10'
                            }`}>
                            <IconComponent className={`w-3.5 h-3.5 transition-colors duration-300
                              ${isVisible ? 'text-white' : 'text-white/60'}`} />
                            
                            {/* Pulsing dot indicator */}
                            {isVisible && layer.id !== 'reports' && (
                              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5">
                                <div className={`absolute inset-0 bg-${layer.color}-400 rounded-full animate-ping opacity-75`} />
                                <div className={`absolute inset-0 bg-${layer.color}-400 rounded-full`} />
                              </div>
                            )}
                          </div>
                          
                          {/* Label and Description */}
                          <div>
                            <div className={`font-semibold text-sm transition-colors duration-300 flex items-center gap-1
                              ${isVisible ? 'text-white' : 'text-white/80'}`}>
                              {layer.label}
                              {layer.id === 'reports' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsReportsExpanded(!isReportsExpanded);
                                  }}
                                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                                >
                                  {isReportsExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            <div className={`text-xs transition-colors duration-300
                              ${isVisible ? 'text-white/70' : 'text-white/50'}`}>
                              {layer.description}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Toggle Switch */}
                        <div 
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300
                            ${isVisible 
                              ? `${layer.toggle} shadow-md ${layer.activeGlow}` 
                              : 'bg-white/20'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLayer(layer.id, !isVisible);
                          }}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all duration-300 shadow-md
                            ${isVisible ? 'translate-x-5 shadow-white/30' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Reports Subfilters */}
                    {layer.id === 'reports' && isReportsExpanded && (
                      <div className="mt-2 ml-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                          <div className="text-xs font-medium text-emerald-300 mb-2">Report Sources</div>
                          {[
                            { id: 'system', label: 'System', description: 'Automated system reports' },
                            { id: 'legacy', label: 'Legacy', description: 'Historical legacy reports' }
                          ].map((subfilter) => {
                            const isSubVisible = reportSubfilters[subfilter.id as keyof typeof reportSubfilters];
                            
                            return (
                              <div
                                key={subfilter.id}
                                className={`relative p-2 rounded-md transition-all duration-200 cursor-pointer text-sm
                                  ${isSubVisible 
                                    ? 'bg-emerald-400/20 border border-emerald-400/30' 
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                  }`}
                                onClick={() => onToggleReportSubfilter?.(subfilter.id as 'system' | 'legacy', !isSubVisible)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full transition-colors duration-200
                                      ${isSubVisible ? 'bg-emerald-400' : 'bg-white/30'}`} />
                                    <div>
                                      <div className={`font-medium transition-colors duration-200
                                        ${isSubVisible ? 'text-white' : 'text-white/80'}`}>
                                        {subfilter.label}
                                      </div>
                                      <div className={`text-xs transition-colors duration-200
                                        ${isSubVisible ? 'text-white/60' : 'text-white/50'}`}>
                                        {subfilter.description}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Mini toggle switch */}
                                  <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-all duration-200
                                    ${isSubVisible 
                                      ? 'bg-emerald-500 shadow-sm' 
                                      : 'bg-white/20'
                                    }`}>
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all duration-200 shadow-sm
                                      ${isSubVisible ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                  </div>
                                </div>
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

            {/* Footer Stats */}
            <div className="px-4 py-2 bg-black/20 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>{visibleLayersExcludingHeatmap.filter(([, value]) => value).length}/{visibleLayersExcludingHeatmap.length} active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapControls; 