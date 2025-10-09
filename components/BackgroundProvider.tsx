'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type ColorSetter = (color: string) => void;
type CssSetter = (css: string | null) => void;

const BackgroundColorContext = createContext<ColorSetter | null>(null);
const BackgroundCssContext = createContext<CssSetter | null>(null);

export function BackgroundColorProvider({
  children,
  initialColor = '#00ff00',
}: {
  children: React.ReactNode;
  initialColor?: string;
}) {
  const [color, setColor] = useState(initialColor);
  const [customCss, setCustomCss] = useState<string | null>(null);
  const styleElRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // apply as CSS variable so any CSS/SVG can read it
    document.documentElement.style.setProperty('--bg-graphic-color', color);
  }, [color]);

  useEffect(() => {
    // create the style element once
    if (typeof window === 'undefined') return;
    let el = document.getElementById('bg-custom-style') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'bg-custom-style';
      document.head.appendChild(el);
    }
    styleElRef.current = el;

    return () => {
      // remove the style element on unmount
      try {
        if (styleElRef.current && styleElRef.current.parentNode) {
          styleElRef.current.parentNode.removeChild(styleElRef.current);
        }
      } catch {
        // ignore
      }
      styleElRef.current = null;
    };
  }, []);

  useEffect(() => {
    // update the style element content whenever customCss changes
    if (styleElRef.current) {
      styleElRef.current.textContent = customCss ?? '';
    }
  }, [customCss]);

  return (
    <BackgroundColorContext.Provider value={setColor}>
      <BackgroundCssContext.Provider value={setCustomCss}>
        {children}
      </BackgroundCssContext.Provider>
    </BackgroundColorContext.Provider>
  );
}

export function useBackgroundColor() {
  const setter = useContext(BackgroundColorContext);
  if (!setter) throw new Error('useBackgroundColor must be used inside BackgroundColorProvider');
  return setter;
}

export function useBackgroundCss() {
  const setter = useContext(BackgroundCssContext);
  if (!setter) throw new Error('useBackgroundCss must be used inside BackgroundColorProvider');
  return setter;
}