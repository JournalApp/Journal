import React from 'react'
import { theme } from 'themes'

export function TrafficLightOutline({ tintColor, ...props }: any) {
  return (
    <svg width={56} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <circle cx={8} cy={8} r={5.5} stroke={tintColor || theme('color.primary.main')} />
      <circle cx={28} cy={8} r={5.5} stroke={tintColor || theme('color.primary.main')} />
      <circle cx={48} cy={8} r={5.5} stroke={tintColor || theme('color.primary.main')} />
    </svg>
  )
}
