import React from 'react';
import { theme } from '@/themes';

export function Edit({ tintColor, size, ...props }: any) {
  switch (size) {
    default:
      return (
        <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M15.5 6.5l2 2-7 7-3 1 1-3 7-7z'
            stroke={tintColor || theme('color.primary.main')}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
  }
}
