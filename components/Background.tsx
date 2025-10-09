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

  return null;
}