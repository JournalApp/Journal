import React from 'react'
import { theme } from 'themes'

export function Settings({ tintColor, ...props }: any) {
  return (
    <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <g clipPath='url(#prefix__clip0_3475_6147)'>
        <path
          d='M15.135 6.784a2 2 0 01-1.23-2.969c.322-.536.225-.998-.094-1.316l-.31-.31c-.318-.318-.78-.415-1.316-.094A2 2 0 019.216.865C9.065.258 8.669 0 8.219 0h-.438c-.45 0-.845.258-.997.865a2 2 0 01-2.969 1.23c-.536-.322-.999-.225-1.317.093l-.31.31c-.318.318-.415.781-.093 1.317a2 2 0 01-1.23 2.969C.26 6.935 0 7.33 0 7.781v.438c0 .45.258.845.865.997a2 2 0 011.23 2.969c-.322.536-.225.998.094 1.316l.31.31c.319.319.782.415 1.316.094a2 2 0 012.969 1.23c.151.607.547.865.997.865h.438c.45 0 .845-.258.997-.865a2 2 0 012.969-1.23c.535.321.997.225 1.316-.094l.31-.31c.318-.318.415-.78.094-1.316a2 2 0 011.23-2.969c.607-.151.865-.547.865-.997v-.438c0-.451-.26-.846-.865-.997zM8 11a3 3 0 110-6 3 3 0 010 6z'
          fill='url(#prefix__paint0_linear_3475_6147)'
        />
      </g>
      <defs>
        <linearGradient
          id='prefix__paint0_linear_3475_6147'
          x1={13}
          y1={1}
          x2={2.5}
          y2={16}
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#CFC6B9' />
          <stop offset={1} stopColor='#9F9894' />
        </linearGradient>
        <clipPath id='prefix__clip0_3475_6147'>
          <path fill='#fff' d='M0 0h16v16H0z' />
        </clipPath>
      </defs>
    </svg>
  )
}
