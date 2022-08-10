import React, { useEffect, useRef, useState } from 'react'
import { theme } from 'themes'
import styled from 'styled-components'
import { ordinal, breakpoints, logger, arrayEquals } from 'utils'
import { Icon } from 'components'
import { useUserContext, useEntriesContext } from 'context'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const TagsInputWrapper = styled.div`
  padding: 4px 0 8px 0;
`

const TagsInput = styled.input`
  font-size: 14px;
  padding: 3px 3px 3px 20px;
  width: -webkit-fill-available;
  display: block;
  border-radius: 100px;
  border: 1px solid ${theme('color.secondary.surface')};
  background-color: ${theme('color.secondary.surface')};
  color: ${theme('color.primary.main')};
  outline: 0;
  &:focus {
    border: 1px solid ${theme('color.secondary.hover')};
  }
  &:before {
    content: '+';
  }
`

const PlusIcon = styled((props) => <Icon {...props} />)`
  position: absolute;
  opacity: 0.3;
  margin-top: 5px;
  left: 4px;
`

type EntryTagsProps = {
  date: string
}

function EntryTags({ date }: EntryTagsProps) {
  return (
    <></>
    // <DropdownMenu.Root>
    //   <DropdownMenu.Trigger>
    //     <TagsInputWrapper>
    //       <PlusIcon name='Plus' />
    //       <TagsInput placeholder='Tag'></TagsInput>
    //     </TagsInputWrapper>
    //   </DropdownMenu.Trigger>
    //   <DropdownMenu.Portal>
    //     <DropdownMenu.Content>
    //       <DropdownMenu.Label>Label</DropdownMenu.Label>
    //       <DropdownMenu.Item>…</DropdownMenu.Item>
    //       <DropdownMenu.Item>…</DropdownMenu.Item>
    //       <DropdownMenu.Item>…</DropdownMenu.Item>
    //     </DropdownMenu.Content>
    //   </DropdownMenu.Portal>
    // </DropdownMenu.Root>
  )
}

export { EntryTags }
