import React from 'react'
import { theme } from 'themes'

export function Check({ tintColor, size = 24, ...props }: any) {
  switch (size) {
    case 24:
      return (
        <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M5 13l4 4L19 7'
            stroke={tintColor || theme('color.primary.main')}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      )
    case 16:
      return (
        <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M3 8l3 3 7-7'
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
