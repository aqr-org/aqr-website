'use client';

import React from 'react';

export default function BackgroundGraphics({
  className = '',
}: {
  className?: string;
}) {
  // SVG reads CSS variable --bg-graphic-color (set by provider)
  return (
    <div
      aria-hidden
      className={`
        pointer-events-none 
        fixed inset-0 -z-10 
        bg-graphics 
        flex items-center justify-center 
        w-full h-full
        bg-qreen
        ${className}
      `}
      style={{ mixBlendMode: 'normal' }}
    >
      <svg width="1440" height="1024" viewBox="0 0 1440 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="M1148.03 380.527C1196.54 352.519 1213.15 290.492 1185.12 241.987C1157.1 193.482 1095.06 176.865 1046.55 204.874C998.034 232.882 981.425 294.908 1009.45 343.414C1037.47 391.919 1099.51 408.535 1148.03 380.527Z" fill="url(#paint0_linear_236_190)"/>
          <path d="M498.635 481.133C623.217 409.206 665.872 249.916 593.907 125.35C521.941 0.784392 362.608 -41.8874 238.026 30.0402C113.444 101.968 70.7892 261.257 142.754 385.823C214.72 510.389 374.053 553.061 498.635 481.133Z" fill="url(#paint1_radial_236_190)"/>
          <path d="M770.74 791.981C819.251 763.973 835.861 701.946 807.838 653.441C779.815 604.936 717.772 588.319 669.26 616.328C620.748 644.336 604.139 706.362 632.162 754.868C660.185 803.373 722.228 819.989 770.74 791.981Z" fill="url(#paint2_linear_236_190)"/>
          <rect x="1087.41" y="618.632" width="74.978" height="271.747" transform="rotate(-45 1087.41 618.632)" fill="url(#paint3_linear_236_190)"/>
          <rect x="213.271" y="565.614" width="74.978" height="271.747" transform="rotate(45 213.271 565.614)" fill="url(#paint4_linear_236_190)"/>
        </g>
        <defs>
          <linearGradient id="paint0_linear_236_190" x1="1009.46" y1="343.409" x2="1176.27" y2="247.039" gradientUnits="userSpaceOnUse">
            <stop offset="0.02" stopColor="#7BBD40"/>
            <stop offset="1" stopColor="#7BBD40" stopOpacity="0"/>
          </linearGradient>
          <radialGradient id="paint1_radial_236_190" cx="0" cy="0" r="1" gradientTransform="matrix(220.672 -127.405 127.472 220.643 357 262.128)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7BBD40"/>
            <stop offset="1" stopColor="#FCFAF0" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="paint2_linear_236_190" x1="632.169" y1="754.863" x2="798.979" y2="658.493" gradientUnits="userSpaceOnUse">
            <stop offset="0.02" stopColor="#F1B355"/>
            <stop offset="1" stopColor="#F1B355" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint3_linear_236_190" x1="1124.9" y1="618.632" x2="1124.9" y2="890.379" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EBFE56"/>
            <stop offset="1" stopColor="#EBFE56" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="paint4_linear_236_190" x1="250.76" y1="565.614" x2="250.76" y2="837.361" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7BBD40"/>
            <stop offset="1" stopColor="#7BBD40" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>

    </div>
  );
}