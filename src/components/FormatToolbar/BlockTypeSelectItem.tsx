import React from 'react'
import { Icon } from 'components'
import { theme } from 'themes'
import styled from 'styled-components'

const ItemWrapper = styled.button`
  display: flex;
  border: 0;
  gap: 8px;
  padding: 2px 12px 2px 4px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  background-color: ${theme('color.neutral.popper')};
  align-items: center;
  transition: ${theme('animation.time.normal')};
  &:hover {
    background-color: ${theme('color.neutral.hover')};
  }
`
type ItemCurrentProps = {
  current: boolean
}

const ItemTitle = styled.span<ItemCurrentProps>`
  font-size: 14px;
  font-weight: ${(props) => (props.current ? '700' : 'normal')};
  line-height: 20px;
  flex-grow: 1;
  text-align: left;
`

const ItemCurrent = styled(({ current, ...props }) => (
  <Icon name='Check' {...props} />
))<ItemCurrentProps>`
  visibility: ${(props) => (props.current ? 'visible' : 'hidden')};
`

type ItemProps = {
  onMouseDown: (e: any) => void
  icon: string
  current: boolean
  children: string
}

const BlockTypeSelectItem = ({ onMouseDown, icon, current = false, children }: ItemProps) => {
  return (
    <ItemWrapper onMouseDown={onMouseDown}>
      <Icon name={icon} />
      <ItemTitle current={current}>{children}</ItemTitle>
      <ItemCurrent current={current} />
    </ItemWrapper>
  )
}

export { BlockTypeSelectItem }
