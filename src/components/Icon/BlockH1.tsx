import React from 'react'
import { theme } from 'themes'

export function BlockH1({ tintColor, ...props }: any) {
  return (
    <svg width={32} height={32} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M5.238 18V7.818h2.153v4.201h4.37v-4.2h2.148V18H11.76v-4.206h-4.37V18H5.238zM20.054 7.818V18H17.9V9.862h-.06l-2.331 1.461V9.414l2.52-1.596h2.024z'
        fill={tintColor || theme('color.primary.main')}
      />
      <path
        opacity={0.15}
        d='M27 25H5a1 1 0 100 2h22a1 1 0 100-2z'
        fill={tintColor || theme('color.primary.main')}
      />
    </svg>
  )
}
