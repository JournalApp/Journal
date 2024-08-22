import React from 'react';
import { theme } from '@/themes';

export function Chevron({ tintColor, size = 16, type = 'down', ...props }: any) {
  switch (type) {
    case 'down':
      switch (size) {
        case 16:
          return (
            <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
              <path
                d='M12 6l-4 4-4-4'
                stroke={tintColor || theme('color.primary.main')}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          );
        case 8:
          return (
            <svg width={8} height={8} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
              <path
                d='M7 3L4 6 1 3'
                stroke={tintColor || theme('color.primary.main')}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          );
          default:
            return <></>;
      }

    case 'up':
      switch (size) {
        case 16:
          return (
            <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
              <path
                d='M4 10l4-4 4 4'
                stroke={tintColor || theme('color.primary.main')}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          );
        case 8:
          return (
            <svg width={8} height={8} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
              <path
                d='M1 5l3-3 3 3'
                stroke={tintColor || theme('color.primary.main')}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          );
          default:
            return <></>;
      }
    default:
      return <></>;
  }
}
