import React from 'react'
import { theme } from 'themes'

export function Check({ tintColor, ...props }: any) {
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
}
