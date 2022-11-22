import React from 'react'
import { theme } from 'themes'

export function Check({ tintColor, size = 24, ...props }: any) {
  switch (size) {
    case 48:
      return (
        <svg width={48} height={48} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <g clipPath='url(#prefix__clip0_3631_10827)'>
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M0 24.023c0 13.234 10.766 24 24 24s24-10.766 24-24c0-13.233-10.766-24-24-24s-24 10.767-24 24zm18.332 9.922a2.332 2.332 0 003.336 0l15.78-16.153a2.023 2.023 0 00-2.895-2.827L20 29.862l-6.553-6.708a2.023 2.023 0 00-2.894 2.828l7.779 7.963z'
              fill={tintColor || theme('color.primary.main')}
            />
          </g>
          <defs>
            <clipPath id='prefix__clip0_3631_10827'>
              <path fill='#fff' d='M0 0h48v48H0z' />
            </clipPath>
          </defs>
        </svg>
      )
    case 24:
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
    case 16:
      return (
        <svg width={16} height={16} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
          <path
            d='M3 8l3 3 7-7'
            stroke={tintColor || theme('color.primary.main')}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      )
    default:
      return <></>
  }
}
