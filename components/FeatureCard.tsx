import React, { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Calendar, MapPin, User, Shield, FileText, Target, Layers, Clock, AlertTriangle, SquareArrowOutUpRight } from 'lucide-react';

interface FeatureCardProps {
  feature: any;
  onClose: () => void;
  map?: any; // Mapbox map instance
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onClose, map }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!feature || !map) return;

    const updatePosition = () => {
      try {
        let coordinates;
        
        // Get coordinates based on geometry type
        if (feature.geometry?.type === 'Point') {
          coordinates = feature.geometry.coordinates;
        } else if (feature.geometry?.type === 'Polygon') {
          // Use center of polygon
          const coords = feature.geometry.coordinates[0];
          if (coords && coords.length > 0) {
            const lats = coords.map((coord: number[]) => coord[1]);
            const lngs = coords.map((coord: number[]) => coord[0]);
            const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
            const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
            coordinates = [centerLng, centerLat];
          }
        }

        if (coordinates) {
          // Convert world coordinates to screen coordinates
          const point = map.project(coordinates);
          
          // Check if the feature is actually visible on the globe
          const center = map.getCenter();
          
          // Calculate the difference in longitude to determine if it's on the visible side
          let lngDiff = Math.abs(coordinates[0] - center.lng);
          if (lngDiff > 180) {
            lngDiff = 360 - lngDiff;
          }
          
          // If the longitude difference is greater than ~90 degrees, it's on the back side
          const isOnVisibleSide = lngDiff < 90;
          
          // Also check if the point is within the canvas bounds
          const canvas = map.getCanvas();
          const rect = canvas.getBoundingClientRect();
          const isInBounds = point.x >= -50 && point.x <= rect.width + 50 && 
                            point.y >= -50 && point.y <= rect.height + 50;
          
          if (isOnVisibleSide && isInBounds) {
            // Calculate card dimensions for positioning
            const cardWidth = 320; // max-width from CSS
            const cardHeight = 200; // approximate height
            const offset = 20; // distance from feature
            
            // Determine if we should position to the left or right
            const spaceOnRight = rect.width - point.x;
            const spaceOnLeft = point.x;
            
            let x, y;
            
            if (spaceOnRight >= cardWidth + offset) {
              // Position to the right
              x = point.x + offset;
              y = point.y - cardHeight / 2;
            } else if (spaceOnLeft >= cardWidth + offset) {
              // Position to the left
              x = point.x - cardWidth - offset;
              y = point.y - cardHeight / 2;
            } else {
              // Not enough space on either side, position above
              x = point.x;
              y = point.y - cardHeight - offset;
            }
            
            // Ensure card stays within bounds
            x = Math.max(10, Math.min(x, rect.width - cardWidth - 10));
            y = Math.max(10, Math.min(y, rect.height - cardHeight - 10));
            
            setPosition({ x, y });
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error updating feature card position:', error);
        setIsVisible(false);
      }
    };

    // Update position initially
    updatePosition();

    // Update position on map move/rotate
    const handleMapMove = () => {
      updatePosition();
    };

    map.on('move', handleMapMove);
    map.on('rotate', handleMapMove);
    map.on('zoom', handleMapMove);

    return () => {
      map.off('move', handleMapMove);
      map.off('rotate', handleMapMove);
      map.off('zoom', handleMapMove);
    };
  }, [feature, map]);

  if (!feature || !isVisible) return null;

  // Handle both GeoJSON features and Mapbox vector tile features
  const properties = feature.properties || {};
  const geometry = feature.geometry || {};
  const { type } = properties;

  // Format timestamp if available
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get coordinates for display
  const getCoordinates = () => {
    if (geometry.type === 'Point' && geometry.coordinates) {
      const [lng, lat] = geometry.coordinates;
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } else if (geometry.type === 'Polygon' && geometry.coordinates) {
      // Show center of polygon bounds
      const coords = geometry.coordinates[0];
      if (coords && coords.length > 0) {
        const lats = coords.map((coord: number[]) => coord[1]);
        const lngs = coords.map((coord: number[]) => coord[0]);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        return `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`;
      }
    }
    return 'N/A';
  };

  // Get type-specific icon
  const getTypeIcon = () => {
    switch (type) {
      case 'RFI':
        return <Shield className="w-5 h-5" />;
      case 'Report':
        return <FileText className="w-5 h-5" />;
      case 'Target':
        return <Target className="w-5 h-5" />;
      case 'Layer':
        return <Layers className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  // Get type-specific color scheme
  const getTypeColors = () => {
    switch (type) {
      case 'RFI':
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/30',
          text: 'text-indigo-400',
          badge: 'bg-indigo-500/20 text-indigo-300'
        };
      case 'Report':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300'
        };
      case 'Target':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300'
        };
      case 'Layer':
        return {
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/30',
          text: 'text-slate-400',
          badge: 'bg-slate-500/20 text-slate-300'
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          badge: 'bg-gray-500/20 text-gray-300'
        };
    }
  };

  const colors = getTypeColors();

  // Render type-specific content
  const renderTypeSpecificContent = () => {
    switch (type) {
      case 'RFI':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium">{properties.name || 'Unnamed RFI'}</span>
            </div>
            
            {properties.description && (
              <p className="text-sm text-white/70 leading-relaxed">{properties.description}</p>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Created:</span>
                <span className="text-white/80">{formatDate(properties.date_created)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Due:</span>
                <span className="text-white/80">{formatDate(properties.due_date)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`${colors.badge} text-xs`}>
                {properties.priority || 'Medium'}
              </Badge>
              <Badge className="bg-white/10 text-white/80 text-xs">
                {properties.status || 'Open'}
              </Badge>
            </div>

            {properties.requester && (
              <div className="flex items-center gap-1 text-xs">
                <User className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Requester:</span>
                <span className="text-white/80">{properties.requester}</span>
              </div>
            )}

            {(properties.related_targets?.length > 0 || properties.related_reports?.length > 0) && (
              <>
                <Separator className="bg-white/10" />
                <div className="space-y-2">
                  {properties.related_targets?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-white/60">Related Targets: </span>
                      <span className="text-amber-400">{properties.related_targets.length}</span>
                    </div>
                  )}
                  {properties.related_reports?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-white/60">Related Reports: </span>
                      <span className="text-emerald-400">{properties.related_reports.length}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator className="bg-white/10" />
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2"
              onClick={() => console.log('View RFI clicked:', properties.id)}
            >
              <span className="flex items-center gap-2">
                View RFI
                <SquareArrowOutUpRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        );

      case 'Report':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium">{properties.name || 'Unnamed Report'}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Created:</span>
                <span className="text-white/80">{formatDate(properties.date_created)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Source:</span>
                <span className="text-white/80">{properties.source || 'Unknown'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`${colors.badge} text-xs`}>
                {properties.classification || 'Unclassified'}
              </Badge>
            </div>

            {(properties.related_targets?.length > 0 || properties.related_rfis?.length > 0) && (
              <>
                <Separator className="bg-white/10" />
                <div className="space-y-2">
                  {properties.related_targets?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-white/60">Related Targets: </span>
                      <span className="text-amber-400">{properties.related_targets.length}</span>
                    </div>
                  )}
                  {properties.related_rfis?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-white/60">Related RFIs: </span>
                      <span className="text-indigo-400">{properties.related_rfis.length}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator className="bg-white/10" />
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2"
              onClick={() => console.log('Open Report clicked:', properties.id)}
            >
              <span className="flex items-center gap-2">
                Open Report
                <SquareArrowOutUpRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        );

      case 'Target':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium">{properties.target_name || 'Unnamed Target'}</span>
            </div>

            {properties.target_code && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-white/60">Code:</span>
                <span className="text-white/80 font-mono">{properties.target_code}</span>
              </div>
            )}

            {(properties.related_rfis?.length > 0 || properties.related_reports?.length > 0) && (
              <>
                <Separator className="bg-white/10" />
                <div className="space-y-2">
                  {properties.related_rfis?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-white/60">Related RFIs: </span>
                      <span className="text-indigo-400">{properties.related_rfis.length}</span>
                    </div>
                  )}
                  {properties.related_reports?.length > 0 && (
                    <div className="text-xs">
                      <span className="text-white/60">Related Reports: </span>
                      <span className="text-emerald-400">{properties.related_reports.length}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator className="bg-white/10" />
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm py-2"
              onClick={() => console.log('View Target clicked:', properties.id)}
            >
              <span className="flex items-center gap-2">
                View Target
                <SquareArrowOutUpRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        );

      case 'Layer':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-white/90 font-medium">{properties.layer_name || 'Unnamed Layer'}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Acquired:</span>
                <span className="text-white/80">{formatDate(properties.acquisition_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Type:</span>
                <span className="text-white/80">{properties.source_type || 'Unknown'}</span>
              </div>
            </div>

            {properties.satellite_metadata && (
              <>
                <Separator className="bg-white/10" />
                <div className="space-y-1 text-xs">
                  <div className="text-white/60 font-medium">Metadata:</div>
                  {properties.satellite_metadata.satellite && (
                    <div>
                      <span className="text-white/50">Satellite: </span>
                      <span className="text-white/80">{properties.satellite_metadata.satellite}</span>
                    </div>
                  )}
                  {properties.satellite_metadata.sensor && (
                    <div>
                      <span className="text-white/50">Sensor: </span>
                      <span className="text-white/80">{properties.satellite_metadata.sensor}</span>
                    </div>
                  )}
                  {(properties.resolution || properties.satellite_metadata.resolution) && (
                    <div>
                      <span className="text-white/50">Resolution: </span>
                      <span className="text-white/80">{properties.resolution || properties.satellite_metadata.resolution}</span>
                    </div>
                  )}
                  {properties.satellite_metadata.cloud_cover && (
                    <div>
                      <span className="text-white/50">Cloud Cover: </span>
                      <span className="text-white/80">{properties.satellite_metadata.cloud_cover}</span>
                    </div>
                  )}
                  {properties.satellite_metadata.processing_level && (
                    <div>
                      <span className="text-white/50">Processing: </span>
                      <span className="text-white/80">{properties.satellite_metadata.processing_level}</span>
                    </div>
                  )}
                  {properties.satellite_metadata.bands && (
                    <div>
                      <span className="text-white/50">Bands: </span>
                      <span className="text-white/80">{properties.satellite_metadata.bands}</span>
                    </div>
                  )}
                  {properties.quality_score && (
                    <div>
                      <span className="text-white/50">Quality: </span>
                      <span className="text-white/80">{properties.quality_score}</span>
                    </div>
                  )}
                  {properties.coverage_area && (
                    <div>
                      <span className="text-white/50">Coverage: </span>
                      <span className="text-white/80">{properties.coverage_area}</span>
                    </div>
                  )}
                  {properties.width && (
                    <div>
                      <span className="text-white/50">Dimensions: </span>
                      <span className="text-white/80">{properties.width} × {properties.height}</span>
                    </div>
                  )}
                  {properties.max_zoom_level && (
                    <div>
                      <span className="text-white/50">Max Zoom: </span>
                      <span className="text-white/80">Level {properties.max_zoom_level}</span>
                    </div>
                  )}
                  {properties.source && (
                    <div>
                      <span className="text-white/50">Source: </span>
                      <span className="text-white/80">{properties.source}</span>
                    </div>
                  )}
                  {properties.owner && (
                    <div>
                      <span className="text-white/50">Owner: </span>
                      <span className="text-white/80">{properties.owner}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator className="bg-white/10" />
            <Button 
              className="w-full bg-slate-600 hover:bg-slate-700 text-white text-sm py-2"
              onClick={() => console.log('View in Exploration clicked:', properties.id)}
            >
              <span className="flex items-center gap-2">
                View in Exploration
                <SquareArrowOutUpRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="text-white/90 font-medium">Unknown Feature</div>
            <div className="text-sm text-white/70">
              <div>ID: {properties.id || feature.id || 'N/A'}</div>
              {properties.timestamp && (
                <div>Date: {formatDate(properties.timestamp)}</div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className={`bg-black/40 backdrop-blur-md border ${colors.border} rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px] pointer-events-auto relative ${colors.bg}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className={colors.text}>
            {getTypeIcon()}
          </div>
          <h3 className="text-lg font-semibold text-white/90">{type === 'Layer' ? 'Image' : type || 'Unknown'}</h3>
        </div>

        {/* Content */}
        {renderTypeSpecificContent()}

        {/* Coordinates */}
        <Separator className="bg-white/10 my-3" />
        <div className="flex items-center gap-1 text-xs text-white/60">
          <MapPin className="w-3 h-3" />
          <span>Coordinates: {getCoordinates()}</span>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard; 