import React from 'react';
import { theme } from '@/themes';

export function BlockBulletList({ tintColor, ...props }: any) {
  return (
    <svg width={32} height={32} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        opacity={0.15}
        d='M23 9h-6a1 1 0 100 2h6a1 1 0 100-2z'
        fill={tintColor || theme('color.primary.main')}
      />
      <circle cx={9.5} cy={10.5} r={2.5} fill={tintColor || theme('color.primary.main')} />
      <circle cx={9.5} cy={20.5} r={2.5} fill={tintColor || theme('color.primary.main')} />
      <path
        opacity={0.15}
        d='M23 15h-6a1 1 0 100 2h6a1 1 0 100-2zM23 21h-6a1 1 0 100 2h6a1 1 0 100-2z'
        fill={tintColor || theme('color.primary.main')}
      />
    </svg>
  );
}
