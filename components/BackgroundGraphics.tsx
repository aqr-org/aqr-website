'use client';

import React from 'react';

export default function BackgroundGraphics() {
  return (
    <div
      aria-hidden
      className={`
        pointer-events-none 
        absolute inset-0 -z-10 
        bg-graphics 
        flex items-start md:items-center justify-center 
        w-full max-w-maxw h-full mx-auto
        overflow-visible
        
      `}
      style={{
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="24" viewBox="0 0 1 24"><line x1="1" y1="0" x2="1" y2="24" stroke="rgba(0,0,0,0.05)" strokeWidth="1" stroke-dasharray="8,8"/></svg>')`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'calc((var(--container-maxw) - 2 * var(--spacing-container)) / 8) 24px',
        backgroundPosition: '50% 50%',
      }}
    >
      

    </div>
  );
}