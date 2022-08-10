import React from 'react'
import { theme } from 'themes'

export function Plus({ tintColor, ...props }: any) {
  return (
    <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M4 8h8M8 4l.002 8'
        stroke={tintColor || theme('color.primary.main')}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
