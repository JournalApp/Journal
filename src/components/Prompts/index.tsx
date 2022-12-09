import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'
import { supabase, isUnauthorized, logger } from 'utils'
import { useQuery } from '@tanstack/react-query'
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
  PromptsCloseButtonStyled,
  PromptTitleStyled,
  PromptContentStyled,
  PromptWindowStyled,
  ChevronStyled,
} from './styled'
import { MDXRemote } from 'next-mdx-remote'
import type { Prompt } from 'types'

const fetchPrompts = async () => {
  const { data, error } = await supabase.from<Prompt>('prompts').select()
  if (error) {
    throw new Error(error.message)
  }
  // await awaitTimeout(5000)
  await Promise.all(
    data.map(
      async (prompt) =>
        (prompt.content = await window.electronAPI.mdxSerialize(prompt.content ?? ''))
    )
  )
  return data
}

const getCachedPrompts = () => {
  const data = window.electronAPI.app.getKey('prompts')
  if (data) {
    try {
      return JSON.parse(data) as Prompt[]
    } catch (error) {
      logger(error)
      return null
    }
  } else {
    return null
  }
}

const cachePrompts = (prompts: Prompt[]) => {
  try {
    window.electronAPI.app.setKey({ prompts: JSON.stringify(prompts) })
  } catch (e) {
    logger(e)
  }
}

const components = {
  p: (props: any) => <p {...props} />,
}

const Prompts = () => {
  const [open, setOpen] = useState(false)
  const [beforeOpen, setBeforeOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState(1)

  const { data: prompts } = useQuery({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
    initialData: getCachedPrompts,
    onSuccess: (data) => cachePrompts(data),
    enabled: open == true,
  })

  useEffect(() => {
    logger(prompts)
  }, [prompts])

  useEffect(() => {
    logger(`Prompts ${open ? 'open' : 'close'}`)
  }, [open])

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

  const selectPrompt = (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    e.stopPropagation()

    logger(`selectPrompt ${id}`)
    if (expanded) {
      setSelectedId(id)
      setExpanded(false)
    }
  }

  const openPrompts = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (open) {
      closePrompts(e)
    } else {
      setOpen(true)
    }
  }

  const closePrompts = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBeforeOpen(false)
    setTimeout(() => {
      setOpen(false)
      setBeforeOpen(true)
    }, 400)
  }

  const expandPromptsList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <>
      <PromptsButtonStyled onMouseDown={(e) => openPrompts(e)}>Prompts</PromptsButtonStyled>
      <FloatingPortal>
        {open && prompts && (
          <PromptWindowStyled
            isExpanded={expanded}
            beforeOpen={beforeOpen}
            ref={floating}
            {...getFloatingProps()}
          >
            {prompts.map((prompt) => {
              return (
                <PromptStyled
                  onMouseDown={(e) => selectPrompt(e, prompt.id)}
                  isExpanded={expanded}
                  isSelected={prompt.id == selectedId}
                  isVisible={expanded || prompt.id == selectedId}
                  key={prompt.id}
                >
                  <PromptTitleStyled
                    isExpanded={expanded}
                    isVisible={expanded || prompt.id == selectedId}
                    onMouseDown={(e) => expandPromptsList(e)}
                  >
                    <div>{prompt.title}</div>
                    {!expanded && <ChevronStyled />}
                  </PromptTitleStyled>
                  <PromptContentStyled
                    isExpanded={expanded}
                    isVisible={expanded || prompt.id == selectedId}
                  >
                    <MDXRemote {...prompt.content} components={components} />
                  </PromptContentStyled>
                </PromptStyled>
              )
            })}
            <PromptsCloseButtonStyled onMouseDown={(e) => closePrompts(e)}>
              Hide
            </PromptsCloseButtonStyled>
          </PromptWindowStyled>
        )}
      </FloatingPortal>
    </>
  )
}

export { Prompts }
