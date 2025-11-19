'use client';

import React, { useEffect, useRef, useMemo, useCallback, memo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWindowSize } from '@/hooks/use-window-size';

// Base shape definitions
const CIRCLE_PATH = "M131.842 150C173.263 150 206.842 116.421 206.842 75C206.842 33.5786 173.263 0 131.842 0C90.4204 0 56.8418 33.5786 56.8418 75C56.8418 116.421 90.4204 150 131.842 150Z";
const QUARTER_CIRCLE_PATH = "M43.3418 468C43.3418 385.992 109.82 319.5 191.842 319.5V376.5C141.303 376.5 100.342 417.469 100.342 468H43.3418Z";
const RECT_WIDTH = 315;
const RECT_HEIGHT = 56;

// Gradient definitions - converted to objectBoundingBox coordinates (0-1 range)
// This makes gradients relative to each shape's bounding box, so they work regardless of position
const GRADIENTS = {
  circles: [
    // Circle bbox: x: 56.8418, y: 0, width: 150, height: 150
    // paint0: x1: 78.8061, y1: 128.029, x2: 184.867, y2: 21.9674
    // Relative: x1: (78.8061-56.8418)/150=0.146, y1: 128.029/150=0.853, x2: (184.867-56.8418)/150=0.853, y2: 21.9674/150=0.146
    { id: 'paint0_linear_204_124', x1: '0.146', y1: '0.853', x2: '0.853', y2: '0.146', color: '#7BBD42' },
    { id: 'paint1_linear_204_124', x1: '0.146', y1: '0.853', x2: '0.853', y2: '0.146', color: '#E27A96' },
    { id: 'paint2_linear_204_124', x1: '0.146', y1: '0.853', x2: '0.853', y2: '0.146', color: '#F1B355' },
    { id: 'paint3_linear_204_124', x1: '0.146', y1: '0.853', x2: '0.853', y2: '0.146', color: '#EBFE56' },
    { id: 'paint4_linear_204_124', x1: '0.146', y1: '0.853', x2: '0.853', y2: '0.146', color: '#4CA79E' },
  ],
  quarterCircles: [
    // Quarter circle bbox: x: 43.3418, y: 319.5, width: 148, height: 148.5
    // paint5: x1: 117.307, y1: 318.921, x2: 117.307, y2: 468
    // Relative: x1: (117.307-43.3418)/148=0.5, y1: (318.921-319.5)/148.5≈0, x2: 0.5, y2: (468-319.5)/148.5=1.0
    { id: 'paint5_linear_204_124', x1: '0.5', y1: '0', x2: '0.5', y2: '1', color: '#7BBD42' },
    { id: 'paint6_linear_204_124', x1: '0.5', y1: '1', x2: '0.5', y2: '0', color: '#E27A96' },
    { id: 'paint7_linear_204_124', x1: '0.5', y1: '1', x2: '0.5', y2: '0', color: '#F1B355' },
    { id: 'paint8_linear_204_124', x1: '0.5', y1: '1', x2: '0.5', y2: '0', color: '#EBFE56' },
    { id: 'paint9_linear_204_124', x1: '0.5', y1: '1', x2: '0.5', y2: '0', color: '#4CA79E' },
  ],
  rects: [
    // Rect bbox: x: 0, y: 804.755, width: 315, height: 56
    // paint10: x1: 0, y1: 832.755, x2: 315, y2: 832.755
    // Relative: x1: 0/315=0, y1: (832.755-804.755)/56=0.5, x2: 315/315=1, y2: 0.5
    { id: 'paint10_linear_204_124', x1: '0', y1: '0.5', x2: '1', y2: '0.5', color: '#7BBD42' },
    { id: 'paint11_linear_204_124', x1: '0', y1: '0.5', x2: '1', y2: '0.5', color: '#E27A96' },
    { id: 'paint12_linear_204_124', x1: '0', y1: '0.5', x2: '1', y2: '0.5', color: '#F1B355' },
    { id: 'paint13_linear_204_124', x1: '0', y1: '0.5', x2: '1', y2: '0.5', color: '#E1F547' },
    { id: 'paint14_linear_204_124', x1: '0', y1: '0.5', x2: '1', y2: '0.5', color: '#4CA79E' },
  ],
};

// Mouse reactivity multipliers
const MOUSE_MULTIPLIERS = [
  { x: 5, y: 5 },
  { x: 7.5, y: 7.5 },
  { x: 6, y: 6 },
  { x: 8.5, y: 8.5 },
  { x: 4, y: 4 },
  { x: 9, y: 9 },
  { x: 5.5, y: 5.5 },
  { x: 7, y: 7 },
  { x: 10, y: 10 },
  { x: 6.5, y: 6.5 },
  { x: 8, y: 8 },
  { x: 4.5, y: 4.5 },
  { x: 7.5, y: 7.5 },
  { x: 9.5, y: 9.5 },
  { x: 5, y: 5 },
];

interface ShapeConfig {
  type: 'circle' | 'quarterCircle' | 'rect';
  gradientId: string;
  mouseMultiplier: { x: number; y: number };
  opacity: number;
  scale: number;
  rotation: number;
  position: { x: number; y: number };
  key: string;
  instanceId: number; // Stable ID for React key
}

interface BackgroundGraphicsProps {}

// Shape component using divs for predictable positioning
const ShapeInstance = function ShapeInstance({
  type,
  gradientId,
  mouseMultiplier,
  opacity,
  scale,
  rotation,
  position,
  bbox,
  index,
  viewBoxWidth,
  viewBoxHeight,
}: {
  type: 'circle' | 'quarterCircle' | 'rect';
  gradientId: string;
  mouseMultiplier: { x: number; y: number };
  opacity: number;
  scale: number;
  rotation: number;
  position: { x: number; y: number };
  bbox: { x: number; y: number; width: number; height: number };
  index: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
}) {
  const shapeRef = useRef<SVGPathElement | SVGRectElement>(null);
  const previousGradientIdRef = useRef<string>(gradientId);
  
  // Calculate shape dimensions and viewBox
  const shapeBbox = useMemo(() => {
    if (type === 'circle') {
      // Circle bbox: x: 56.8418, y: 0, width: 150, height: 150, center at (131.842, 75)
      // viewBox: '56.8418 0 150 150' - viewBox center is at (56.8418 + 75, 0 + 75) = (131.8418, 75)
      return { 
        width: 150, 
        height: 150, 
        centerX: 131.842, 
        centerY: 75,
        viewBox: '56.8418 0 150 150',
        viewBoxX: 56.8418,
        viewBoxY: 0,
      };
    } else if (type === 'quarterCircle') {
      // Quarter circle bbox: x: 43.3418, y: 319.5, width: 148, height: 148.5, center at (117.3418, 393.75)
      // viewBox: '43.3418 319.5 148 148.5' - viewBox center is at (43.3418 + 74, 319.5 + 74.25) = (117.3418, 393.75)
      return { 
        width: 148, 
        height: 148.5, 
        centerX: 117.3418, 
        centerY: 393.75,
        viewBox: '43.3418 319.5 148 148.5',
        viewBoxX: 43.3418,
        viewBoxY: 319.5,
      };
    } else {
      // Rect: width: 315, height: 56, center at (157.5, 28)
      // viewBox: '0 0 315 56' - viewBox center is at (157.5, 28)
      return { 
        width: RECT_WIDTH, 
        height: RECT_HEIGHT, 
        centerX: RECT_WIDTH / 2, 
        centerY: RECT_HEIGHT / 2,
        viewBox: `0 0 ${RECT_WIDTH} ${RECT_HEIGHT}`,
        viewBoxX: 0,
        viewBoxY: 0,
      };
    }
  }, [type]);

  // Convert viewBox coordinates to percentage for CSS positioning
  const leftPercent = (position.x / viewBoxWidth) * 100;
  const topPercent = (position.y / viewBoxHeight) * 100;
  const widthPercent = (bbox.width / viewBoxWidth) * 100;
  const heightPercent = (bbox.height / viewBoxHeight) * 100;
  
  // Shapes are already centered in their viewBoxes, so no offset needed
  // The SVG itself just needs to be centered in the mouse container
  
  // Opacity and scale are now handled via inline styles on the SVG element

  // Apply gradient fill with smooth fade animation
  useEffect(() => {
    const element = shapeRef.current;
    if (!element) return;
    
    const gradientChanged = previousGradientIdRef.current !== gradientId;
    previousGradientIdRef.current = gradientId;
    
    if (gradientChanged) {
      const targetOpacity = parseFloat(opacity.toString());
      element.style.transition = 'opacity 0.3s ease-in-out';
      element.style.opacity = (targetOpacity * 0.6).toString();
      
      setTimeout(() => {
        element.setAttribute('fill', `url(#${gradientId})`);
        setTimeout(() => {
          element.style.opacity = opacity.toString();
          setTimeout(() => {
            element.style.transition = '';
          }, 300);
        }, 50);
      }, 300);
    } else {
      element.setAttribute('fill', `url(#${gradientId})`);
    }
  }, [gradientId, opacity]);

  // Mouse transform calculation - uses CSS variables that update automatically
  const mouseTransform = `translate(calc(var(--mouseXdelta) * ${mouseMultiplier.x}%), calc(var(--mouseYdelta) * ${mouseMultiplier.y}% - var(--scrollYDelta) * 400%))`;
  
  return (
    <div
      className="absolute transition-all duration-1200 flex items-center justify-center"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        pointerEvents: 'none',
      }}
    >
        {/* Mouse reactivity container - centered via flex */}
        <div
          className="flex items-center justify-center"
          style={{
            transform: mouseTransform,
            transformOrigin: 'center center',
            transition: 'none',
          }}
        >
          {/* Rotation container - centered via flex, rotates around center */}
          <div
            className="transition-transform duration-1200 ease-out flex items-center justify-center"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
          {/* SVG shape container - centered via flex */}
          <svg
            width={shapeBbox.width}
            height={shapeBbox.height}
            viewBox={shapeBbox.viewBox}
            style={{
              transform: `scale(${scale})`,
              opacity: opacity,
            }}
            className="transition-opacity duration-300"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Include all gradients in each SVG to ensure they're accessible */}
              {GRADIENTS.circles.map(gradient => (
                <linearGradient 
                  key={gradient.id} 
                  id={gradient.id} 
                  x1={gradient.x1} 
                  y1={gradient.y1} 
                  x2={gradient.x2} 
                  y2={gradient.y2} 
                  gradientUnits="objectBoundingBox"
                >
                  <stop stopColor={gradient.color}/>
                  <stop offset="1" stopColor={gradient.color} stopOpacity="0"/>
                </linearGradient>
              ))}
              {GRADIENTS.quarterCircles.map(gradient => (
                <linearGradient 
                  key={gradient.id} 
                  id={gradient.id} 
                  x1={gradient.x1} 
                  y1={gradient.y1} 
                  x2={gradient.x2} 
                  y2={gradient.y2} 
                  gradientUnits="objectBoundingBox"
                >
                  <stop stopColor={gradient.color}/>
                  <stop offset="1" stopColor={gradient.color} stopOpacity="0"/>
                </linearGradient>
              ))}
              {GRADIENTS.rects.map(gradient => (
                <linearGradient 
                  key={gradient.id} 
                  id={gradient.id} 
                  x1={gradient.x1} 
                  y1={gradient.y1} 
                  x2={gradient.x2} 
                  y2={gradient.y2} 
                  gradientUnits="objectBoundingBox"
                >
                  <stop stopColor={gradient.color} stopOpacity="0"/>
                  <stop offset="1" stopColor={gradient.color}/>
                </linearGradient>
              ))}
            </defs>
            {type === 'circle' && (
              <path
                ref={shapeRef as React.RefObject<SVGPathElement>}
                d={CIRCLE_PATH}
                fill={`url(#${gradientId})`}
                style={{ fill: `url(#${gradientId})` }}
              />
            )}
            {type === 'quarterCircle' && (
              <path
                ref={shapeRef as React.RefObject<SVGPathElement>}
                d={QUARTER_CIRCLE_PATH}
                fill={`url(#${gradientId})`}
                style={{ fill: `url(#${gradientId})` }}
              />
            )}
            {type === 'rect' && (
              <rect
                ref={shapeRef as React.RefObject<SVGRectElement>}
                x="0"
                y="0"
                width={RECT_WIDTH}
                height={RECT_HEIGHT}
                fill={`url(#${gradientId})`}
                style={{ fill: `url(#${gradientId})` }}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

const BackgroundGraphics = memo(function BackgroundGraphics({}: BackgroundGraphicsProps) {
  const pathname = usePathname();
  const windowSize = useWindowSize();
  const [isMounted, setIsMounted] = useState(false);
  const previousShapeConfigsRef = useRef<ShapeConfig[]>([]);
  
  // Position cache: keyed by viewport size bucket to avoid recalculation
  // Buckets: mobile (<768px) and desktop (>=768px), with size ranges
  const positionCacheRef = useRef<Map<string, { configs: ShapeConfig[]; cellWidth: number; cellHeight: number }>>(new Map());
  
  // Debounce timer for shape recalculation
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Routes where background graphics should be hidden
  const hiddenRoutes = ['/', '/home'];
  
  // Get actual screen dimensions for viewBox and grid calculations
  // This updates immediately for viewBox, but shape recalculation is debounced
  const screenDimensions = useMemo(() => {
    if (typeof window === 'undefined' || !isMounted) {
      return { width: 1664, height: 845 };
    }
    // Use windowSize if available and valid, otherwise use defaults
    const width = (windowSize.width > 0) ? windowSize.width : 1664;
    const height = (windowSize.height > 0) ? windowSize.height : 845;
    return { 
      width: Math.max(width, 320), 
      height: Math.max(height, 568) 
    };
  }, [windowSize.width, windowSize.height, isMounted]);
  
  // Generate cache key from viewport dimensions and route
  // Uses buckets to cache similar sizes together, but different routes get different positions
  const getCacheKey = useCallback((width: number, height: number, route: string): string => {
    const isMobile = width < 768;
    // Round to nearest 100px for caching (reduces cache misses on small resizes)
    const bucketWidth = Math.round(width / 100) * 100;
    const bucketHeight = Math.round(height / 100) * 100;
    return `${route}-${isMobile ? 'mobile' : 'desktop'}-${bucketWidth}x${bucketHeight}`;
  }, []);
  
  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate grid cell dimensions based on current viewport
  const getGridCellDimensions = useCallback((screenWidth: number, screenHeight: number) => {
    const isMobile = screenWidth < 768;
    const GRID_COLUMNS = isMobile ? 3 : 4;
    const GRID_ROWS = isMobile ? 2 : 3;
    const SAFETY_MARGIN = 40;
    const padding = SAFETY_MARGIN;
    
    const gridWidth = screenWidth - (padding * 2);
    const gridHeight = screenHeight - (padding * 2);
    const cellWidth = gridWidth / GRID_COLUMNS;
    const cellHeight = gridHeight / GRID_ROWS;
    
    return { cellWidth, cellHeight, padding };
  }, []);

  // Outer group bounding boxes - all use the same grid cell size
  // Shapes are centered within their grid cells
  const getOuterGroupBoxes = useCallback((cellWidth: number, cellHeight: number) => {
    // All outer groups are the same size (one grid cell)
    const width = cellWidth;
    const height = cellHeight;
    
    return {
      circle: {
        x: 0,
        y: 0,
        width,
        height,
        centerX: width / 2,
        centerY: height / 2,
      },
      quarterCircle: {
        x: 0,
        y: 0,
        width,
        height,
        centerX: width / 2,
        centerY: height / 2,
      },
      rect: {
        x: 0,
        y: 0,
        width,
        height,
        centerX: width / 2,
        centerY: height / 2,
      },
    };
  }, []);

  // Calculate positions using grid-based system
  // Creates 3 shapes on mobile (1 of each type), 6 shapes on desktop (2 of each type)
  // Uses fixed grid slots: 3×2 grid (6 slots) on mobile, 4×3 grid (12 slots) on desktop
  // Returns both shape configs and grid cell dimensions
  const calculatePositions = useCallback((
    screenWidth: number,
    screenHeight: number,
    previousConfigs: ShapeConfig[]
  ): { configs: ShapeConfig[]; cellWidth: number; cellHeight: number } => {
    // Determine if mobile (< 768px) or desktop
    const isMobile = screenWidth < 768;
    const TOTAL_SHAPES = isMobile ? 3 : 6;
    const SHAPES_PER_TYPE = isMobile ? 1 : 2;
    
    // Grid dimensions
    const GRID_COLUMNS = isMobile ? 3 : 4;
    const GRID_ROWS = isMobile ? 2 : 3;
    const TOTAL_SLOTS = GRID_COLUMNS * GRID_ROWS; // 6 on mobile, 12 on desktop
    
    // Calculate grid cell dimensions
    const { cellWidth, cellHeight, padding } = getGridCellDimensions(screenWidth, screenHeight);
    
    // Generate all grid slot positions (top-left corners of each cell)
    // Second row (row index 1) is offset by 50% of cell width for staggered layout
    const gridSlots: Array<{ x: number; y: number }> = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      const rowOffset = row === 1 ? cellWidth / 2 : 0; // Offset second row by half a cell width
      for (let col = 0; col < GRID_COLUMNS; col++) {
        const x = padding + col * cellWidth + rowOffset;
        const y = padding + row * cellHeight;
        gridSlots.push({ x, y });
      }
    }
    
    // Shuffle available slots to randomize assignment
    const shuffledSlots = [...gridSlots].sort(() => Math.random() - 0.5);
    
    // Determine shape types that will be placed
    const shapeTypes: Array<'circle' | 'quarterCircle' | 'rect'> = [];
    for (let i = 0; i < SHAPES_PER_TYPE; i++) {
      shapeTypes.push('circle');
    }
    for (let i = 0; i < SHAPES_PER_TYPE; i++) {
      shapeTypes.push('quarterCircle');
    }
    for (let i = 0; i < SHAPES_PER_TYPE; i++) {
      shapeTypes.push('rect');
    }
    
    // Shuffle shape types for random distribution
    const shuffledShapeTypes = [...shapeTypes].sort(() => Math.random() - 0.5);
    
    // Assign shapes to slots (each shape gets a unique slot)
    // Position is the top-left corner of the grid cell
    const shapePositions: Array<{ x: number; y: number; type: 'circle' | 'quarterCircle' | 'rect' }> = [];
    for (let i = 0; i < TOTAL_SHAPES; i++) {
      const slot = shuffledSlots[i];
      const shapeType = shuffledShapeTypes[i];
      shapePositions.push({
        x: slot.x,
        y: slot.y,
        type: shapeType,
      });
    }
    
    // Shuffle gradients for each type
    const shuffledCircles = [...GRADIENTS.circles].sort(() => Math.random() - 0.5);
    const shuffledQuarterCircles = [...GRADIENTS.quarterCircles].sort(() => Math.random() - 0.5);
    const shuffledRects = [...GRADIENTS.rects].sort(() => Math.random() - 0.5);
    
    // Create shapes with stable instance IDs using the grid positions
    const shapeConfigs: ShapeConfig[] = [];
    
    let instanceIdCounter = 0;
    let circleIndex = 0;
    let quarterCircleIndex = 0;
    let rectIndex = 0;
    
    // Create shapes based on the grid positions
    for (const posWithType of shapePositions) {
      const instanceId = instanceIdCounter++;
      
      if (posWithType.type === 'circle') {
        shapeConfigs.push({
          type: 'circle',
          gradientId: shuffledCircles[circleIndex % GRADIENTS.circles.length].id,
          mouseMultiplier: MOUSE_MULTIPLIERS[instanceId % MOUSE_MULTIPLIERS.length],
          opacity: 0.5 + Math.random() * 0.25, // Between 0.5 and 0.75, never fully transparent
          scale: 0.85 + Math.random() * 0.15, // Between 0.85 and 1.0
          rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
          position: { x: posWithType.x, y: posWithType.y },
          key: `shape-instance-${instanceId}`,
          instanceId,
        });
        circleIndex++;
      } else if (posWithType.type === 'quarterCircle') {
        shapeConfigs.push({
          type: 'quarterCircle',
          gradientId: shuffledQuarterCircles[quarterCircleIndex % GRADIENTS.quarterCircles.length].id,
          mouseMultiplier: MOUSE_MULTIPLIERS[instanceId % MOUSE_MULTIPLIERS.length],
          opacity: 0.5 + Math.random() * 0.25, // Between 0.5 and 0.75
          scale: 0.85 + Math.random() * 0.15, // Between 0.85 and 1.0
          rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
          position: { x: posWithType.x, y: posWithType.y },
          key: `shape-instance-${instanceId}`,
          instanceId,
        });
        quarterCircleIndex++;
      } else if (posWithType.type === 'rect') {
        shapeConfigs.push({
          type: 'rect',
          gradientId: shuffledRects[rectIndex % GRADIENTS.rects.length].id,
          mouseMultiplier: MOUSE_MULTIPLIERS[instanceId % MOUSE_MULTIPLIERS.length],
          opacity: 0.5 + Math.random() * 0.25, // Between 0.5 and 0.75
          scale: 0.85 + Math.random() * 0.15, // Between 0.85 and 1.0
          rotation: -45 + [0, 90, 180, 270][Math.floor(Math.random() * 4)],
          position: { x: posWithType.x, y: posWithType.y },
          key: `shape-instance-${instanceId}`,
          instanceId,
        });
        rectIndex++;
      }
    }
    
    return { configs: shapeConfigs, cellWidth, cellHeight };
  }, [getGridCellDimensions]);

  // Memoize shape configurations with caching and debounced recalculation
  // ViewBox updates immediately, but shape positions are cached and debounced on resize
  const [shapeConfigs, setShapeConfigs] = useState<ShapeConfig[]>([]);
  const [gridCellDimensions, setGridCellDimensions] = useState<{ cellWidth: number; cellHeight: number }>({ cellWidth: 0, cellHeight: 0 });
  
  // Store current values in refs to avoid dependency issues while keeping callback stable
  const currentDimensionsRef = useRef(screenDimensions);
  const currentPathnameRef = useRef(pathname);
  const currentIsMountedRef = useRef(isMounted);
  
  useEffect(() => {
    currentDimensionsRef.current = screenDimensions;
  }, [screenDimensions]);
  
  useEffect(() => {
    currentPathnameRef.current = pathname;
  }, [pathname]);
  
  useEffect(() => {
    currentIsMountedRef.current = isMounted;
  }, [isMounted]);
  
  // Calculate or retrieve cached shape configurations
  // Uses refs to avoid dependency issues while keeping callback stable
  const updateShapeConfigs = useCallback((bypassCache = false) => {
    const currentPathname = currentPathnameRef.current;
    const currentIsMounted = currentIsMountedRef.current;
    const currentScreenDimensions = currentDimensionsRef.current;
    
    if (!currentIsMounted) {
      setShapeConfigs([]);
      setGridCellDimensions({ cellWidth: 0, cellHeight: 0 });
      return;
    }
    
    // Don't calculate if on hidden route
    if (hiddenRoutes.includes(currentPathname)) {
      setShapeConfigs([]);
      setGridCellDimensions({ cellWidth: 0, cellHeight: 0 });
      return;
    }
    
    const cacheKey = getCacheKey(currentScreenDimensions.width, currentScreenDimensions.height, currentPathname);
    
    // Check cache first (but bypass on route changes for animation)
    // Cache is primarily for resize events, not route changes
    if (!bypassCache) {
      const cached = positionCacheRef.current.get(cacheKey);
      if (cached) {
        // Use cached positions for resize events
        setShapeConfigs(cached.configs);
        setGridCellDimensions({ cellWidth: cached.cellWidth, cellHeight: cached.cellHeight });
        previousShapeConfigsRef.current = cached.configs;
        return;
      }
    }
    
    // Calculate new positions (always on route change, or cache miss on resize)
    const result = calculatePositions(
      currentScreenDimensions.width, 
      currentScreenDimensions.height,
      previousShapeConfigsRef.current
    );
    
    // Cache the result (for future resize events)
    positionCacheRef.current.set(cacheKey, result);
    
    // Limit cache size to prevent memory leaks (keep last 10 entries)
    if (positionCacheRef.current.size > 10) {
      const firstKey = positionCacheRef.current.keys().next().value;
      if (firstKey) {
        positionCacheRef.current.delete(firstKey);
      }
    }
    
    // Update ref for next route change
    previousShapeConfigsRef.current = result.configs;
    setShapeConfigs(result.configs);
    setGridCellDimensions({ cellWidth: result.cellWidth, cellHeight: result.cellHeight });
  }, [calculatePositions, getCacheKey]); // Stable dependencies only
  
  // Initial calculation and route changes (immediate)
  // On route change, always generate new positions for animation
  useEffect(() => {
    // Clear debounce timer on route change
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Bypass cache on route change to ensure new positions and animation
    updateShapeConfigs(true); // Pass true to bypass cache
  }, [pathname, isMounted, updateShapeConfigs]); // Only on route change or mount
  
  // Debounced recalculation on window resize (separate from viewBox update)
  useEffect(() => {
    // Skip if not mounted or on hidden route
    if (!isMounted || hiddenRoutes.includes(pathname)) {
      return;
    }
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce shape recalculation by 300ms after resize stops
    // ViewBox updates immediately, but shapes only recalculate when resize settles
    // Use cache for resize events (not route changes)
    debounceTimerRef.current = setTimeout(() => {
      updateShapeConfigs(false); // Use cache for resize
    }, 300);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [screenDimensions.width, screenDimensions.height, isMounted, pathname, updateShapeConfigs]);

  // Handle visibility for hidden routes
  const isHidden = hiddenRoutes.includes(pathname);

  if (isHidden) {
    return null;
  }

  return (
    <div
      aria-hidden
      className={`
        pointer-events-none 
        fixed inset-0 -z-10 
        bg-graphics 
        w-full h-full
        overflow-x-hidden overflow-y-visible
        opacity-60 md:opacity-100
      `}
    >
      <div className='absolute z-10 h-full inset-0 top-0 bottom-0 left-1/5 right-1/5 md:left-1/4 md:right-[10%] backdrop-blur-lg bg-qaupe/60 mask-x-from-90%' />
      
      {/* Hidden SVG for gradient definitions */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          {GRADIENTS.circles.map(gradient => (
            <linearGradient 
              key={gradient.id} 
              id={gradient.id} 
              x1={gradient.x1} 
              y1={gradient.y1} 
              x2={gradient.x2} 
              y2={gradient.y2} 
              gradientUnits="objectBoundingBox"
            >
              <stop stopColor={gradient.color}/>
              <stop offset="1" stopColor={gradient.color} stopOpacity="0"/>
            </linearGradient>
          ))}
          {GRADIENTS.quarterCircles.map(gradient => (
            <linearGradient 
              key={gradient.id} 
              id={gradient.id} 
              x1={gradient.x1} 
              y1={gradient.y1} 
              x2={gradient.x2} 
              y2={gradient.y2} 
              gradientUnits="objectBoundingBox"
            >
              <stop stopColor={gradient.color}/>
              <stop offset="1" stopColor={gradient.color} stopOpacity="0"/>
            </linearGradient>
          ))}
          {GRADIENTS.rects.map(gradient => (
            <linearGradient 
              key={gradient.id} 
              id={gradient.id} 
              x1={gradient.x1} 
              y1={gradient.y1} 
              x2={gradient.x2} 
              y2={gradient.y2} 
              gradientUnits="objectBoundingBox"
            >
              <stop stopColor={gradient.color} stopOpacity="0"/>
              <stop offset="1" stopColor={gradient.color}/>
            </linearGradient>
          ))}
        </defs>
      </svg>
      
      {/* Shape containers using divs */}
      <div className="relative w-full h-full">
        {shapeConfigs.map((config, index) => {
          // Only render if we have valid grid cell dimensions
          if (gridCellDimensions.cellWidth <= 0 || gridCellDimensions.cellHeight <= 0) {
            return null;
          }
          // All shapes use the same grid cell size for their outer group bbox
          const bbox = getOuterGroupBoxes(gridCellDimensions.cellWidth, gridCellDimensions.cellHeight)[config.type];
          // Verify bbox has valid dimensions
          if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
            return null;
          }
          return (
            <ShapeInstance
              key={config.key}
              type={config.type}
              gradientId={config.gradientId}
              mouseMultiplier={config.mouseMultiplier}
              opacity={config.opacity}
              scale={config.scale}
              rotation={config.rotation}
              position={config.position}
              bbox={bbox}
              index={index}
              viewBoxWidth={screenDimensions.width}
              viewBoxHeight={screenDimensions.height}
            />
          );
        })}
      </div>
    </div>
  );
});

export default BackgroundGraphics;
