import React from 'react'
import { theme } from 'themes'

export function Exit({ tintColor, ...props }: any) {
  return (
    <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M10.5 5l3 3-3 3M13.5 8h-8M7.5 13.5H4A1.5 1.5 0 012.5 12V4A1.5 1.5 0 014 2.5h3.5'
        stroke={tintColor || theme('color.primary.main')}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
