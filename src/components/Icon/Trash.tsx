import React from 'react';
import { theme } from '@/themes';

export function Trash({ tintColor, ...props }: any) {
  return (
    <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M7.5 10.5v7c0 1.105.806 2 1.8 2h5.4c.995 0 1.8-.895 1.8-2v-7M5.5 7.5h13M9.5 7.5v-3h5v3M13.5 11.5v5M10.5 11.5v5'
        stroke={tintColor || theme('color.primary.main')}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
