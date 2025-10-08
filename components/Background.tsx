'use client';

import { useEffect } from 'react';
import { useBackgroundColor } from '@/components/BackgroundProvider';

interface Props {
  color: string;
}

export default function HomePage({ color }: Props) {
  const setBg = useBackgroundColor();

  useEffect(() => {
    // set per-route color
    setBg(color);
    return () => setBg(color); // optional reset on unmount
  }, [setBg, color]);

  return null;
}