'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Setter = (color: string) => void;
const BackgroundColorContext = createContext<Setter | null>(null);

export function BackgroundColorProvider({
  children,
  initialColor = '#00ff00',
}: {
  children: React.ReactNode;
  initialColor?: string;
}) {
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    // apply as CSS variable so any CSS/SVG can read it
    document.documentElement.style.setProperty('--bg-graphic-color', color);
  }, [color]);

  return (
    <BackgroundColorContext.Provider value={setColor}>
      {children}
    </BackgroundColorContext.Provider>
  );
}

export function useBackgroundColor() {
  const setter = useContext(BackgroundColorContext);
  if (!setter) throw new Error('useBackgroundColor must be used inside BackgroundColorProvider');
  return setter;
}