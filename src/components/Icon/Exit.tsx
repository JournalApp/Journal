import React from 'react'
import { theme } from 'themes'

// export function Exit({ tintColor, ...props }: any) {
//   return (
//     <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
//       <path
//         d='M10.5 5l3 3-3 3M13.5 8h-8M7.5 13.5H4A1.5 1.5 0 012.5 12V4A1.5 1.5 0 014 2.5h3.5'
//         stroke={tintColor || theme('color.primary.main')}
//         strokeLinecap='round'
//         strokeLinejoin='round'
//       />
//     </svg>
//   )
// }

export function Exit({ tintColor, ...props }: any) {
  return (
    <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <g clipPath='url(#prefix__clip0_1614_2242)'>
        <path
          d='M14 0H2a1 1 0 00-1 1v11a1 1 0 00.606.919l7 3A1 1 0 0010 15V4a1 1 0 00-.606-.919L6.872 2H13v9h-2v2h3a1 1 0 001-1V1a1 1 0 00-1-1z'
          fill='url(#prefix__paint0_linear_1614_2242)'
        />
      </g>
      <defs>
        <linearGradient
          id='prefix__paint0_linear_1614_2242'
          x1={8}
          y1={0}
          x2={8}
          y2={16}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#F1C4A3' />
          <stop offset={1} stopColor='#CA9184' />
        </linearGradient>
        <clipPath id='prefix__clip0_1614_2242'>
          <path fill='#fff' d='M0 0h16v16H0z' />
        </clipPath>
      </defs>
    </svg>
  )
}
