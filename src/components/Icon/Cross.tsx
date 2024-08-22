import React from 'react';
import { theme } from '@/themes';

export function Cross({ tintColor, size, ...props }: any) {
  switch (size) {
    case 12:
      return (
        <svg width={12} height={12} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M2.5 2.5l7 7M9.5 2.5l-7 7'
            stroke={tintColor || theme('color.primary.main')}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );

    case 16:
      return (
        <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M3.5 3.5l9 9M12.5 3.5l-9 9'
            stroke={tintColor || theme('color.primary.main')}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );

    default:
      return (
        <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M17.854 6.854a.5.5 0 00-.708-.708L12 11.293 6.854 6.146a.5.5 0 10-.708.708L11.293 12l-5.147 5.146a.5.5 0 00.708.708L12 12.707l5.146 5.147a.5.5 0 00.708-.708L12.707 12l5.147-5.146z'
            fill={tintColor || theme('color.primary.main')}
          />
        </svg>
      );
  }
}
