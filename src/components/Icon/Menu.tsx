import React from 'react'
import { theme } from 'themes'

export function Menu({ tintColor, ...props }: any) {
  return (
    <svg width={16} height={16} xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M2 10a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm8-2a2 2 0 11-4 0 2 2 0 014 0z'
        fill={tintColor || theme('color.primary.main')}
      />
    </svg>
  )
}
