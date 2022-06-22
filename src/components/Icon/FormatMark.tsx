import * as React from 'react'
import { theme } from 'themes'

export function FormatMark({ tintColor, ...props }: any) {
  return (
    <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <circle
        cx={12}
        cy={12}
        r={11}
        fill={theme('color.highlight.surface')}
        stroke={tintColor || theme('color.popper.surface')}
        strokeWidth={1}
      />
    </svg>
  )
}
