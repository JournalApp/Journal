import React from 'react';
import { theme } from '@/themes';

export function Offline({ tintColor, ...props }: any) {
  return (
    <svg width={48} height={48} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M35.018 13.982A14.883 14.883 0 0023.5 8.5a15.043 15.043 0 00-15 14.3 7.927 7.927 0 00-6 7.7 8.024 8.024 0 008 8M16.5 38.5h22a8 8 0 000-16h-.1a14.856 14.856 0 00-1.231-5.012M44.5 4.5l-40 40'
        stroke={tintColor || theme('color.primary.main')}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
