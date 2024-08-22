import React from 'react';

export function UpdateNow({ ...props }: any) {
  return (
    <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M16 8c0-4.4-3.6-8-8-8S0 3.6 0 8s3.6 8 8 8 8-3.6 8-8zM4 8h3V4h2v4h3l-4 4-4-4z'
        fill='url(#prefix__paint0_linear_2072_2203)'
      />
      <defs>
        <linearGradient
          id='prefix__paint0_linear_2072_2203'
          x1={8}
          y1={0}
          x2={8}
          y2={16}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#98D38A' />
          <stop offset={1} stopColor='#43AA8B' />
        </linearGradient>
      </defs>
    </svg>
  );
}
