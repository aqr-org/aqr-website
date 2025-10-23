'use client';

import { useEffect } from 'react';
import { useBackgroundColor, useBackgroundCss } from '@/components/BackgroundProvider';

interface Props {
  color?: string;
  css?: string;
}

export default function HomePage({ color, css }: Props) {
  const setBg = useBackgroundColor();
  const setCss = useBackgroundCss();

  useEffect(() => {
    if (color) setBg(color);
    return () => {
      // no-op: keep current color unless caller explicitly resets
    };
  }, [setBg, color]);

  useEffect(() => {
    if (css) setCss(css);
    return () => {
      // clear css on unmount if we set it
      if (css) setCss(null);
    };
  }, [setCss, css]);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafActive = false;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    
    // Easing factor (0-1, lower = smoother, higher = more responsive)
    const easingFactor = 0.1;
  
    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!rafActive) {
        rafActive = true;
        requestAnimationFrame(updateCSSVars);
      }
    }
  
    function onResize() {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;
    }
  
    function updateCSSVars() {
      // Calculate center of window
      const centerX = windowWidth / 2;
      const centerY = windowHeight / 2;
      
      // Calculate target offset from center (-1 to 1 range)
      const targetDeltaX = (mouseX - centerX) / centerX;
      const targetDeltaY = (mouseY - centerY) / centerY;
      
      // Apply easing to current values
      currentX += (targetDeltaX - currentX) * easingFactor;
      currentY += (targetDeltaY - currentY) * easingFactor;
      
      // Clamp values to ensure they stay within -1 to 1 range
      const clampedDeltaX = Math.max(-1, Math.min(1, currentX));
      const clampedDeltaY = Math.max(-1, Math.min(1, currentY));
      
      document.documentElement.style.setProperty('--mouseXdelta', clampedDeltaX.toString());
      document.documentElement.style.setProperty('--mouseYdelta', clampedDeltaY.toString());
      
      // Continue animation if there's still movement
      const deltaThreshold = 0.001; // Adjust for sensitivity
      if (Math.abs(targetDeltaX - currentX) > deltaThreshold || 
          Math.abs(targetDeltaY - currentY) > deltaThreshold) {
        requestAnimationFrame(updateCSSVars);
      } else {
        rafActive = false;
      }
    }
  
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);
  
    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}