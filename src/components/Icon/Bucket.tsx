import React from 'react'
import { theme } from 'themes'

export function Bucket({ tintColor, ...props }: any) {
  return (
    <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M1.5 3.5v9c0 1.657 2.91 3 6.5 3s6.5-1.343 6.5-3v-9'
        stroke={tintColor || theme('color.primary.main')}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M14.5 3.5c0-1.657-2.91-3-6.5-3s-6.5 1.343-6.5 3c0 1.579 2.645 2.87 6 2.988V10a1.5 1.5 0 003 0V6.269c2.349-.452 4-1.521 4-2.769z'
        stroke={tintColor || theme('color.primary.main')}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
