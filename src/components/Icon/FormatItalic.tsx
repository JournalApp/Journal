import * as React from 'react'

export function FormatItalic({ tintColor, ...props }: any) {
  return (
    <svg width={24} height={24} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M10.602 18l1.454-8.727h1.341L11.943 18h-1.341zm2.534-10.205a.953.953 0 01-.676-.267.858.858 0 01-.279-.642c0-.25.093-.464.279-.642a.953.953 0 01.676-.267c.261 0 .485.09.67.267a.85.85 0 01.284.642.85.85 0 01-.284.642.934.934 0 01-.67.267z'
        fill={tintColor || 'black'}
      />
    </svg>
  )
}
