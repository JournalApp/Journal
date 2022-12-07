import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'
import { supabase, isUnauthorized, logger } from 'utils'
import { useUserContext } from 'context'
import {
  useFloating,
  FloatingTree,
  FloatingOverlay,
  useInteractions,
  useDismiss,
  useClick,
  FloatingFocusManager,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react-dom-interactions'
import {
  PromptStyled,
  PromptsButtonStyled,
  PromptTitleStyled,
  PromptContentStyled,
  PromptWindowStyled,
  ChevronStyled,
} from './styled'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'

const PromptsData = [
  {
    id: '1',
    title: 'Morning kickstart',
    content: `What's the 1 thing I need to do?`,
  },
  {
    id: '2',
    title: 'Your monthly reflection',
    content: `What's 1 thing I'm grateful for?
    What's 1 thing I'm excited about?`,
  },
  {
    id: '3',
    title: 'Bottleneck analysis',
    content: `What's 1 thing I'm excited about? What's 1 thing I'm excited about?`,
  },
  {
    id: '4',
    title: 'The evening shutdown',
    content: `What were the biggest wins of the day?`,
  },
]

const Prompts = () => {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState('1')

  const { floating, context, refs } = useFloating({
    open: expanded,
    onOpenChange: setExpanded,
  })

  const { getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, {
      escapeKey: true,
    }),
  ])

  const selectPrompt = (id: string) => {
    logger(`selectPrompt ${id}`)
    if (expanded) {
      setSelectedId(id)
      setExpanded(false)
    }
  }

  return (
    <>
      <PromptsButtonStyled>Prompts</PromptsButtonStyled>
      <FloatingPortal>
        {open && (
          <PromptWindowStyled isExpanded={expanded} ref={floating} {...getFloatingProps()}>
            {PromptsData.map((prompt) => {
              return (
                <PromptStyled
                  onClick={() => selectPrompt(prompt.id)}
                  isExpanded={expanded}
                  isVisible={expanded || prompt.id == selectedId}
                  key={prompt.id}
                >
                  <PromptTitleStyled
                    isExpanded={expanded}
                    isVisible={expanded || prompt.id == selectedId}
                    onClick={() => setExpanded(!expanded)}
                  >
                    <div>{prompt.title}</div>
                    {!expanded && <ChevronStyled />}
                  </PromptTitleStyled>
                  <PromptContentStyled
                    isExpanded={expanded}
                    isVisible={expanded || prompt.id == selectedId}
                  >
                    {prompt.content}
                  </PromptContentStyled>
                </PromptStyled>
              )
            })}
          </PromptWindowStyled>
        )}
      </FloatingPortal>
    </>
  )
}

export { Prompts }
