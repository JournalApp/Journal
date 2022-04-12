import React from 'react'
import { theme } from 'themes'

export function Chevron({ tintColor, type = 'down', ...props }: any) {
  switch (type) {
    case 'down':
      return (
        <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M12 6l-4 4-4-4'
            stroke={tintColor || theme('color.primary.main')}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      )

    case 'up':
      return (
        <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M4 10l4-4 4 4'
            stroke={tintColor || theme('color.primary.main')}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      )

    default:
      return <></>
  }
}
