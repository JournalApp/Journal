import * as React from 'react';
import { theme } from '@/themes';

export function FormatCode({ tintColor, ...props }: any) {
  return (
    <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M8.854 8.854a.5.5 0 10-.708-.708l-4 4a.5.5 0 000 .708l4 4a.5.5 0 00.708-.708L5.207 12.5l3.647-3.646zm7-.708a.5.5 0 00-.708.708l3.647 3.646-3.647 3.646a.5.5 0 00.708.708l4-4a.5.5 0 000-.708l-4-4z'
        fill={tintColor || theme('color.primary.main')}
      />
    </svg>
  );
}
