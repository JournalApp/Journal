import React from 'react'

type IconMapType = {
  [key: string]: any
}

type IconProps = {
  name: keyof IconMapType
  size?: number
  scale?: number
}

const IconMap: IconMapType = {
  empty: Empty,
  ideas: Ideas,
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
        d='M20 9C20 4.582 16.418 1 12 1C7.582 1 4 4.582 4 9C4 12.357 6.069 15.226 9 16.413V19H15V16.413C17.931 15.226 20 12.357 20 9Z'
        stroke='url(#paint0_linear)'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M15 19V23H9V19'
        stroke='url(#paint1_linear)'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M8 9C8 6.791 9.791 5 12 5'
        stroke='url(#paint2_linear)'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <defs>
        <linearGradient
          id='paint0_linear'
          x1='-5.45455'
          y1='25.75'
          x2='107.039'
          y2='12.1292'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DFF098' />
          <stop offset='0.174623' stopColor='#AAD691' />
          <stop offset='0.4149' stopColor='#6FE8FF' />
          <stop offset='1' stopColor='#9796EC' />
        </linearGradient>
        <linearGradient
          id='paint1_linear'
          x1='5.45455'
          y1='24.5'
          x2='46.5427'
          y2='16.1047'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DFF098' />
          <stop offset='0.174623' stopColor='#AAD691' />
          <stop offset='0.4149' stopColor='#6FE8FF' />
          <stop offset='1' stopColor='#9796EC' />
        </linearGradient>
        <linearGradient
          id='paint2_linear'
          x1='5.63636'
          y1='10.5'
          x2='33.6522'
          y2='6.68381'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#DFF098' />
          <stop offset='0.174623' stopColor='#AAD691' />
          <stop offset='0.4149' stopColor='#6FE8FF' />
          <stop offset='1' stopColor='#9796EC' />
        </linearGradient>
      </defs>
    </svg>
  )
}

export { Icon }
