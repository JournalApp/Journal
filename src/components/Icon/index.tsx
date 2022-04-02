import React from 'react'
import { Check24 } from './Check'
import { FormatBold } from './FormatBold'
import { FormatItalic } from './FormatItalic'
import { FormatUnderline } from './FormatUnderline'
import { FormatStriketrough } from './FormatStriketrough'
import { FormatCode } from './FormatCode'

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
  Empty,
  Check24,
  FormatBold,
  FormatItalic,
  FormatUnderline,
  FormatStriketrough,
  FormatCode,
}

const Icon = function (props: IconProps) {
  const { name, size, scale, ...rest }: IconProps = props
  const Drawing = IconMap[name] ? IconMap[name] : IconMap['Empty']

  return <Drawing size={size} scale={scale} {...rest} />
}

function Empty() {
  return <></>
}

export { Icon }
