import React from 'react'
import { theme } from 'themes'

export function Cross({ tintColor, ...props }: any) {
  return (
    <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M17.854 6.854a.5.5 0 00-.708-.708L12 11.293 6.854 6.146a.5.5 0 10-.708.708L11.293 12l-5.147 5.146a.5.5 0 00.708.708L12 12.707l5.146 5.147a.5.5 0 00.708-.708L12.707 12l5.147-5.146z'
        fill={tintColor || theme('color.primary.main')}
      />
    </svg>
  )
}
