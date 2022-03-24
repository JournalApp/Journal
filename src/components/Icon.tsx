import React from 'react'

type IconMapType = {
  [key: string]: any
}

type IconProps = {
  name: keyof IconMapType
  size?: number
  scale?: number
  active?: boolean
  tintColor?: any
}

const IconMap: IconMapType = {
  empty: Empty,
  ideas: Ideas,
  check24: Check24,
}

const Icon = function (props: IconProps) {
  const { name, size, scale, ...rest }: IconProps = props
  const Drawing = IconMap[name] ? IconMap[name] : IconMap['empty']

  return <Drawing size={size} scale={scale} {...rest} />
}

function Empty() {
  return <></>
}

function Ideas({ tintColor, ...props }: any) {
  console.log(props)
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M15 4H23'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        stroke-linejoin='round'
      />
      <path
        d='M15 11H23'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        stroke-linejoin='round'
      />
      <path
        d='M15 18H23'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        stroke-linejoin='round'
      />
      <path
        d='M11 18H8C4.134 18 1 14.866 1 11C1 7.134 4.134 4 8 4H11'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        stroke-linejoin='round'
      />
      <path
        d='M7 14L11 18L7 22'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        stroke-linejoin='round'
      />
    </svg>
  )
}

function Check24({ tintColor, ...props }: any) {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M6 12L10 16L18 8'
        stroke={tintColor || 'black'}
        strokeWidth='2'
        strokeMiterlimit='10'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export { Icon }
