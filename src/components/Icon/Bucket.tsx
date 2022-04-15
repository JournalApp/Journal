import React from 'react'
import { theme } from 'themes'

// export function Bucket({ tintColor, ...props }: any) {
//   return (
//     <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
//       <path
//         d='M1.5 3.5v9c0 1.657 2.91 3 6.5 3s6.5-1.343 6.5-3v-9'
//         stroke={tintColor || theme('color.primary.main')}
//         strokeLinecap='round'
//         strokeLinejoin='round'
//       />
//       <path
//         d='M14.5 3.5c0-1.657-2.91-3-6.5-3s-6.5 1.343-6.5 3c0 1.579 2.645 2.87 6 2.988V10a1.5 1.5 0 003 0V6.269c2.349-.452 4-1.521 4-2.769z'
//         stroke={tintColor || theme('color.primary.main')}
//         strokeLinecap='round'
//         strokeLinejoin='round'
//       />
//     </svg>
//   )
// }

export function Bucket({ tintColor, ...props }: any) {
  return (
    <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M8 0C4.5 0 1 .9 1 3v10c0 2.1 3.5 3 7 3s7-.9 7-3V3c0-2.1-3.5-3-7-3zm0 2c2.8 0 4.4.6 4.9 1-.2.2-.9.5-2.1.8-.5.1-.8.5-.8 1V9c0 .6-.4 1-1 1s-1-.4-1-1V5c0-.5-.4-1-.9-1-2.3-.1-3.6-.7-4-1 .5-.4 2.1-1 4.9-1z'
        fill='url(#prefix__paint0_linear_1614_2236)'
      />
      <defs>
        <linearGradient
          id='prefix__paint0_linear_1614_2236'
          x1={8}
          y1={0}
          x2={8}
          y2={16}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#5E76F8' />
          <stop offset={1} stopColor='#995EF8' />
        </linearGradient>
      </defs>
    </svg>
  )
}
