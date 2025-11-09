'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function BackgroundGraphics() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathname = usePathname();

   // Routes where background graphics should be hidden
   const hiddenRoutes = ['/', '/home'];

   
   useEffect(() => {
     const svg = svgRef.current;
     if (!svg) return;

    // Early return if current route should hide background
    if (hiddenRoutes.includes(pathname)) {
      // Actively hide all elements when on hidden route
      const allElements = Array.from(svg.querySelectorAll('path, rect')) as (SVGPathElement | SVGRectElement)[];
      const defs = svg.querySelector('defs');
      const elements = allElements.filter(el => !defs?.contains(el));
      
      elements.forEach((element) => {
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
      });
      
      // Also hide the container div
      const container = svg.closest('div');
      if (container) {
        container.style.display = 'none';
      }
      
      return; // Exit early from useEffect
    }

    // Show container if it was hidden
    const container = svg.closest('div');
    if (container) {
      container.style.display = '';
    }


    const positionElements = () => {
      // Get all path and rect elements (excluding those inside defs)
      const allElements = Array.from(svg.querySelectorAll('path, rect')) as (SVGPathElement | SVGRectElement)[];
      const defs = svg.querySelector('defs');
      const elements = allElements.filter(el => !defs?.contains(el));

      if (elements.length === 0) return;

      // Get SVG's bounding box and viewBox dimensions
      const svgRect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      const svgViewBoxWidth = viewBox.width || 1664;
      const svgViewBoxHeight = viewBox.height || 845;

      // Ensure SVG is rendered (has dimensions)
      if (svgRect.width === 0 || svgRect.height === 0) {
        // Retry after a short delay if SVG not yet rendered
        setTimeout(positionElements, 100);
        return;
      }

      // Calculate scale factor between viewBox and actual rendered size
      const scaleX = svgRect.width / svgViewBoxWidth;
      const scaleY = svgRect.height / svgViewBoxHeight;

      // Group elements into three categories using fill URL pattern
      // paint0-4: first 5 paths (circles)
      // paint5-9: second 5 paths (quarter circles)
      // paint10-14: rects
      const first5Paths: (SVGPathElement | SVGRectElement)[] = [];
      const second5Paths: (SVGPathElement | SVGRectElement)[] = [];
      const rects: (SVGPathElement | SVGRectElement)[] = [];
      
      elements.forEach((element) => {
        const fill = element.getAttribute('fill') || '';
        // Extract paint number from fill URL (e.g., "url(#paint5_linear_204_124)" -> 5)
        const paintMatch = fill.match(/paint(\d+)_linear/);
        if (paintMatch) {
          const paintNum = parseInt(paintMatch[1], 10);
          if (paintNum >= 0 && paintNum <= 4) {
            first5Paths.push(element);
          } else if (paintNum >= 5 && paintNum <= 9) {
            second5Paths.push(element);
          } else if (paintNum >= 10 && paintNum <= 14) {
            rects.push(element);
          }
        }
      });

      // Shuffle each group separately
      const shuffledFirst5 = [...first5Paths].sort(() => Math.random() - 0.5);
      const shuffledSecond5 = [...second5Paths].sort(() => Math.random() - 0.5);
      const shuffledRectsInitial = [...rects].sort(() => Math.random() - 0.5);

      // Select approximately 2 from each group for even distribution
      // We need 6 total: 2 from each group (use available elements if fewer)
      const selectedFromFirst = shuffledFirst5.slice(0, Math.min(2, shuffledFirst5.length));
      const selectedFromSecond = shuffledSecond5.slice(0, Math.min(2, shuffledSecond5.length));
      const selectedFromRects = shuffledRectsInitial.slice(0, Math.min(2, shuffledRectsInitial.length));
      
      // Ensure even distribution of opacity across groups
      // From each group, assign one to opacity100 and one to opacity30
      const opacity100: (SVGPathElement | SVGRectElement)[] = [];
      const opacity30: (SVGPathElement | SVGRectElement)[] = [];
      
      // Shuffle each group's selected elements
      const shuffledFirst = [...selectedFromFirst].sort(() => Math.random() - 0.5);
      const shuffledSecond = [...selectedFromSecond].sort(() => Math.random() - 0.5);
      const shuffledRects = [...selectedFromRects].sort(() => Math.random() - 0.5);
      
      // Assign one from each group to opacity100, one to opacity30
      if (shuffledFirst.length >= 2) {
        opacity100.push(shuffledFirst[0]);
        opacity30.push(shuffledFirst[1]);
      } else if (shuffledFirst.length === 1) {
        opacity100.push(shuffledFirst[0]);
      }
      
      if (shuffledSecond.length >= 2) {
        opacity100.push(shuffledSecond[0]);
        opacity30.push(shuffledSecond[1]);
      } else if (shuffledSecond.length === 1) {
        opacity100.push(shuffledSecond[0]);
      }
      
      if (shuffledRects.length >= 2) {
        opacity100.push(shuffledRects[0]);
        opacity30.push(shuffledRects[1]);
      } else if (shuffledRects.length === 1) {
        opacity100.push(shuffledRects[0]);
      }
      
      // Shuffle the final arrays so they're not grouped by type
      const shuffledOpacity100 = [...opacity100].sort(() => Math.random() - 0.5);
      const shuffledOpacity30 = [...opacity30].sort(() => Math.random() - 0.5);
      
      const visibleElements = [...shuffledOpacity100, ...shuffledOpacity30];

      // Create a 4x3 grid (4 columns, 3 rows = 12 cells)
      const gridCols = 4;
      const gridRows = 3;
      const padding = 50;
      const gridWidth = svgViewBoxWidth - padding * 2;
      const gridHeight = svgViewBoxHeight - padding * 2;
      const cellWidth = gridWidth / gridCols;
      const cellHeight = gridHeight / gridRows;

      // Generate all grid cell positions
      const gridCells: Array<{ x: number; y: number }> = [];
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          // Center of each grid cell
          const x = padding + col * cellWidth + cellWidth / 2;
          const y = padding + row * cellHeight + cellHeight / 2;
          gridCells.push({ x, y });
        }
      }

      // Combine all elements (visible and invisible)
      const combinedElements = [...first5Paths, ...second5Paths, ...rects];
      
      // Shuffle grid cells and assign positions to ALL elements (so they all stay within viewport)
      // Visible elements get unique positions, invisible elements can reuse positions
      const shuffledGridCells = [...gridCells].sort(() => Math.random() - 0.5);
      
      // Create a map of element to position for ALL elements
      const elementToPosition = new Map<SVGPathElement | SVGRectElement, { x: number; y: number }>();
      
      // Track which grid positions are used by visible elements
      const usedPositions = new Set<number>();
      
      // Assign unique grid positions to visible elements
      visibleElements.forEach((element, index) => {
        if (index < shuffledGridCells.length) {
          elementToPosition.set(element, shuffledGridCells[index]);
          usedPositions.add(index);
        }
      });
      
      // For invisible elements, prefer unused positions, then cycle through all positions
      let gridIndex = 0;
      combinedElements.forEach((element) => {
        if (!elementToPosition.has(element)) {
          // First try to find an unused position
          let positionIndex = -1;
          for (let i = 0; i < shuffledGridCells.length; i++) {
            if (!usedPositions.has(i)) {
              positionIndex = i;
              usedPositions.add(i);
              break;
            }
          }
          
          // If all positions are used, cycle through all positions
          if (positionIndex === -1) {
            positionIndex = gridIndex % shuffledGridCells.length;
            gridIndex++;
          }
          
          elementToPosition.set(element, shuffledGridCells[positionIndex]);
        }
      });

      // Apply random positions and opacities
      combinedElements.forEach((element) => {
        // Get the inner group (contains mouse reactivity) and outer group (for positioning)
        const innerGroup = element.parentElement as SVGGElement | null;
        const outerGroup = innerGroup?.parentElement as SVGGElement | null;
        
        if (!innerGroup || innerGroup.tagName !== 'g' || !outerGroup || outerGroup.tagName !== 'g') {
          console.warn('Element is not properly wrapped in two groups:', element);
          return;
        }

        // Reset any existing CSS transforms and filters on element and outer group
        element.style.transform = '';
        element.style.filter = '';
        element.removeAttribute('filter');
        element.removeAttribute('transform');
        outerGroup.style.transform = '';
        outerGroup.style.transformBox = 'fill-box';

        // Get element's current position in viewBox coordinates
        const bbox = element.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        // Get position from grid - all elements stay within viewport
        let position = elementToPosition.get(element);
        if (!position) {
          // Fallback: use original position if somehow not assigned
          position = { x: centerX, y: centerY };
        }

        // Calculate target position center in screen pixels
        const targetCenterXPx = position.x * scaleX;
        const targetCenterYPx = position.y * scaleY;
        
        // Calculate element's original center in screen pixels
        const originalCenterXPx = centerX * scaleX;
        const originalCenterYPx = centerY * scaleY;

        // Build transform for outer group
        // Mouse reactivity is already handled by inner group in markup
        let outerTransform = '';
        
        if (element.tagName === 'path' || element.tagName === 'rect') {
          // For path and rect elements: rotate by 0, 90, 180, or 270 degrees
          // Rotate around the element's center, then translate to target position
          const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
          
          // Transform chain (applied right-to-left):
          // 1. translate(-originalCenterX, -originalCenterY): move element center to origin
          // 2. rotate(deg): rotate around origin (where element center now is)
          // 3. translate(targetCenterX, targetCenterY): move to target position
          outerTransform = `translate(${targetCenterXPx}px, ${targetCenterYPx}px) rotate(${rotation}deg) translate(${-originalCenterXPx}px, ${-originalCenterYPx}px)`;
        } else {
          // Fallback: simple translation to target position
          const offsetX = targetCenterXPx - originalCenterXPx;
          const offsetY = targetCenterYPx - originalCenterYPx;
          outerTransform = `translate(${offsetX}px, ${offsetY}px)`;
        }

        // Apply positioning transform to outer group only
        outerGroup.style.transform = outerTransform;

        // Remove inline opacity attribute to let CSS control it
        element.removeAttribute('opacity');

        // Apply opacity based on group using inline styles (overrides className)
        if (opacity100.includes(element)) {
          element.style.opacity = '0.75';
        } 
        else if (opacity30.includes(element)) {
          element.style.opacity = '0.66';
          element.style.scale = '0.9';
        } 
        else {
          element.style.opacity = '0.25';
          element.style.scale = '0.8';
        }
      });
    };

    // Wait for next frame to ensure SVG is rendered
    requestAnimationFrame(positionElements);
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={`
        pointer-events-none 
        fixed inset-0 -z-10 
        bg-graphics 
        flex items-start md:items-center justify-center 
        w-full h-full
        overflow-x-hidden overflow-y-visible       
      `}
      // bg lines pattern:
      // style={{
      //   backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="24" viewBox="0 0 1 24"><line x1="1" y1="0" x2="1" y2="24" stroke="rgba(0,0,0,0.05)" strokeWidth="1" stroke-dasharray="8,8"/></svg>')`,
      //   backgroundRepeat: 'repeat',
      //   backgroundSize: 'calc((var(--container-maxw) - 2 * var(--spacing-container)) / 8) 24px',
      //   backgroundPosition: '50% 50%',
      //   display: hiddenRoutes.includes(pathname) ? 'none' : undefined
      // }}
    >
      <div className='absolute hidden md:block h-full inset-0 top-0 bottom-0 left-1/4 right-[23%] backdrop-blur-lg bg-qaupe/60' />
      <svg 
        ref={svgRef} 
        id="bg_graphics" 
        width="1664" height="845" viewBox="0 0 1664 845" fill="none" xmlns="http://www.w3.org/2000/svg"
        className='overflow-visible [&>g]:opacity-60 md:[&>g]:opacity-100'
      >
        {/* Outer group: positioning/opacity, Inner group: mouse reactivity */}
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{ 
              transformBox: 'fill-box', 
              transform: 'translate(calc(var(--mouseXdelta) * 5%), calc(var(--mouseYdelta) * 5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className=' origin-bottom-right opacity-0 transition-all duration-1200' d="M131.842 150C173.263 150 206.842 116.421 206.842 75C206.842 33.5786 173.263 0 131.842 0C90.4204 0 56.8418 33.5786 56.8418 75C56.8418 116.421 90.4204 150 131.842 150Z" fill="url(#paint0_linear_204_124)" />
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 7.5%), calc(var(--mouseYdelta) * 7.5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className=' origin-bottom-right opacity-0 transition-all duration-1200' d="M481.842 150C523.263 150 556.842 116.421 556.842 75C556.842 33.5786 523.263 0 481.842 0C440.42 0 406.842 33.5786 406.842 75C406.842 116.421 440.42 150 481.842 150Z" fill="url(#paint1_linear_204_124)" />
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 6%), calc(var(--mouseYdelta) * 6% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className=' origin-bottom-right opacity-0 transition-all duration-1200' d="M831.842 150C873.263 150 906.842 116.421 906.842 75C906.842 33.5786 873.263 0 831.842 0C790.42 0 756.842 33.5786 756.842 75C756.842 116.421 790.42 150 831.842 150Z" fill="url(#paint2_linear_204_124)" />
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 8.5%), calc(var(--mouseYdelta) * 8.5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className=' origin-bottom-right opacity-0 transition-all duration-1200' d="M1181.84 150C1223.26 150 1256.84 116.421 1256.84 75C1256.84 33.5786 1223.26 0 1181.84 0C1140.42 0 1106.84 33.5786 1106.84 75C1106.84 116.421 1140.42 150 1181.84 150Z" fill="url(#paint3_linear_204_124)" />
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 4%), calc(var(--mouseYdelta) * 4% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className=' origin-bottom-right opacity-0 transition-all duration-1200' d="M1531.84 150C1573.26 150 1606.84 116.421 1606.84 75C1606.84 33.5786 1573.26 0 1531.84 0C1490.42 0 1456.84 33.5786 1456.84 75C1456.84 116.421 1490.42 150 1531.84 150Z" fill="url(#paint4_linear_204_124)" />
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 9%), calc(var(--mouseYdelta) * 9% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 transition-all duration-1200' opacity="0.7" d="M43.3418 468C43.3418 385.992 109.82 319.5 191.842 319.5V376.5C141.303 376.5 100.342 417.469 100.342 468H43.3418Z" fill="url(#paint5_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 5.5%), calc(var(--mouseYdelta) * 5.5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 transition-all duration-1200' opacity="0.7" d="M393.342 468C393.342 385.992 459.82 319.5 541.842 319.5V376.5C491.303 376.5 450.342 417.469 450.342 468H393.342Z" fill="url(#paint6_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 7%), calc(var(--mouseYdelta) * 7% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 transition-all duration-1200' opacity="0.7" d="M743.342 468C743.342 385.992 809.82 319.5 891.842 319.5V376.5C841.303 376.5 800.342 417.469 800.342 468H743.342Z" fill="url(#paint7_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 10%), calc(var(--mouseYdelta) * 10% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 transition-all duration-1200' opacity="0.7" d="M1093.34 468C1093.34 385.992 1159.82 319.5 1241.84 319.5V376.5C1191.3 376.5 1150.34 417.469 1150.34 468H1093.34Z" fill="url(#paint8_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 6.5%), calc(var(--mouseYdelta) * 6.5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <path style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 transition-all duration-1200' opacity="0.7" d="M1443.34 468C1443.34 385.992 1509.82 319.5 1591.84 319.5V376.5C1541.3 376.5 1500.34 417.469 1500.34 468H1443.34Z" fill="url(#paint9_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 8%), calc(var(--mouseYdelta) * 8% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <rect style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 -rotate-45 transition-all duration-1200' y="804.755" width="315" height="56" fill="url(#paint10_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 4.5%), calc(var(--mouseYdelta) * 4.5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <rect style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 -rotate-45 transition-all duration-1200' x="350.337" y="804.755" width="315" height="56" fill="url(#paint11_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 7.5%), calc(var(--mouseYdelta) * 7.5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <rect style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 -rotate-45 transition-all duration-1200' x="700.673" y="804.755" width="315" height="56" fill="url(#paint12_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 9.5%), calc(var(--mouseYdelta) * 9.5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <rect style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 -rotate-45 transition-all duration-1200' x="1051.01" y="804.755" width="315" height="56" fill="url(#paint13_linear_204_124)"/>
          </g>
        </g>
        <g className="transition-all duration-1200" style={{ transformBox: 'fill-box' }}>
          <g 
            style={{
               transformBox: 'fill-box', 
               transform: 'translate(calc(var(--mouseXdelta) * 5%), calc(var(--mouseYdelta) * 5% - var(--scrollYDelta) * 400%))' 
            }}
          >
            <rect style={{ transformBox: 'fill-box' }} className='origin-center opacity-0 -rotate-45 transition-all duration-1200' x="1401.35" y="804.755" width="315" height="56" fill="url(#paint14_linear_204_124)"/>
          </g>
        </g>
        <defs>
          <linearGradient id="paint0_linear_204_124" x1="78.8061" y1="128.029" x2="184.867" y2="21.9674" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7BBD42"/>
          <stop offset="1" stopColor="#7BBD42" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint1_linear_204_124" x1="428.806" y1="128.029" x2="534.867" y2="21.9674" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E27A96"/>
          <stop offset="1" stopColor="#E27A96" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint2_linear_204_124" x1="778.806" y1="128.029" x2="884.867" y2="21.9674" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1B355"/>
          <stop offset="1" stopColor="#F1B355" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint3_linear_204_124" x1="1128.81" y1="128.029" x2="1234.87" y2="21.9674" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EBFE56"/>
          <stop offset="1" stopColor="#EBFE56" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint4_linear_204_124" x1="1478.81" y1="128.029" x2="1584.87" y2="21.9674" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4CA79E"/>
          <stop offset="1" stopColor="#4CA79E" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint5_linear_204_124" x1="117.307" y1="318.921" x2="117.307" y2="468" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7BBD42"/>
          <stop offset="1" stopColor="#7BBD42" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint6_linear_204_124" x1="481.842" y1="468" x2="481.842" y2="348" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E27A96" stopOpacity="0"/>
          <stop offset="1" stopColor="#E27A96"/>
          </linearGradient>
          <linearGradient id="paint7_linear_204_124" x1="831.842" y1="468" x2="831.842" y2="348" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1B355" stopOpacity="0"/>
          <stop offset="1" stopColor="#F1B355"/>
          </linearGradient>
          <linearGradient id="paint8_linear_204_124" x1="1181.84" y1="468" x2="1181.84" y2="348" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EBFE56" stopOpacity="0"/>
          <stop offset="1" stopColor="#EBFE56"/>
          </linearGradient>
          <linearGradient id="paint9_linear_204_124" x1="1531.84" y1="468" x2="1531.84" y2="348" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4CA79E" stopOpacity="0"/>
          <stop offset="1" stopColor="#4CA79E"/>
          </linearGradient>
          <linearGradient id="paint10_linear_204_124" x1="0" y1="832.755" x2="315" y2="832.755" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7BBD42" stopOpacity="0"/>
          <stop offset="1" stopColor="#7BBD42"/>
          </linearGradient>
          <linearGradient id="paint11_linear_204_124" x1="350.337" y1="832.755" x2="665.337" y2="832.755" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E27A96" stopOpacity="0"/>
          <stop offset="1" stopColor="#E27A96"/>
          </linearGradient>
          <linearGradient id="paint12_linear_204_124" x1="700.673" y1="832.755" x2="1015.67" y2="832.755" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1B355" stopOpacity="0"/>
          <stop offset="1" stopColor="#F1B355"/>
          </linearGradient>
          <linearGradient id="paint13_linear_204_124" x1="1051.01" y1="832.755" x2="1366.01" y2="832.755" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E1F547" stopOpacity="0"/>
          <stop offset="1" stopColor="#E1F547"/>
          </linearGradient>
          <linearGradient id="paint14_linear_204_124" x1="1401.35" y1="832.755" x2="1716.35" y2="832.755" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4CA79E" stopOpacity="0"/>
          <stop offset="1" stopColor="#4CA79E"/>
          </linearGradient>
        </defs>
      </svg>

    </div>
  );
}