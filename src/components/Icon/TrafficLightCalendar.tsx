import React from 'react';
import { theme } from '@/themes';

export function TrafficLightCalendar({ tintColor, type = 'down', ...props }: any) {
  switch (type) {
    case 'off':
      return (
        <svg width={19} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <rect
            x={0.5}
            y={2.5}
            width={18}
            height={11}
            rx={2.5}
            stroke={tintColor || theme('color.primary.main')}
          />
          <path
            fill={tintColor || theme('color.primary.main')}
            d='M7 3h1v10H7zM3 6h2v1H3zM3 9h2v1H3z'
          />
        </svg>
      );
    case 'on':
      return (
        <svg width={19} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <rect
            x={0.5}
            y={2.5}
            width={18}
            height={11}
            rx={2.5}
            stroke={tintColor || theme('color.primary.main')}
          />
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M1 3h6v10H1V3zm2 3h2v1H3V6zm2 3H3v1h2V9z'
            fill={tintColor || theme('color.primary.main')}
          />
        </svg>
      );
    default:
      return <></>;
  }
}
