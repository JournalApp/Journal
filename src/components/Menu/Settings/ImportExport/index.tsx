import React, { useState, useEffect, useRef } from 'react'
import { theme } from 'themes'
import { logger } from 'utils'
import { SectionTitleStyled } from '../styled'
import { serialize } from 'remark-slate'
import { useEntriesContext, useUserContext } from 'context'
import type { Entry } from 'types'
import { plateNodeTypes } from './nodeTypes'
import styled from 'styled-components'

const WrapperStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`
const ButtonsWrapperStyled = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: fit-content;
  padding-top: 16px;
`

const ButtonStyled = styled.button`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  white-space: nowrap;
  padding: 8px 16px;
  color: ${theme('color.popper.main')};
  border: 1px solid ${theme('color.popper.main')};
  border-radius: 6px;
  flex: 1;
  background: transparent;
  cursor: pointer;
  outline: 0;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 3px ${theme('color.popper.main', 0.2)};
    transition: box-shadow ${theme('animation.time.normal')} ease;
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

const TitleStyled = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.03em;
`

const TextStyled = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  opacity: 0.6;
`

const toMarkdown = (content: any) => {
  return content
    .map((v: any) => {
      logger(v)
      if (v.type == 'hr') {
        return '---\n'
      }
      if (!!!v?.type) {
        logger('no type')
        v.type = 'p'
      }
      //@ts-ignore
      return serialize(v, { nodeTypes: plateNodeTypes })
    })
    .join('')
}

const exportTxt = (entries: Entry[]) => {
  try {
    const output = entries
      .map((entry) => {
        return 'Day: ' + entry.day + '\n\n' + toMarkdown(entry.content)
      })
      .join('\n\n\n')
    window.electronAPI.saveFile(output, 'txt')
  } catch (error) {
    logger('Error:')
    logger(error)
  }
}

const exportJson = (entries: Entry[]) => {
  try {
    const output = entries.map((entry) => {
      return {
        day: entry.day,
        content: toMarkdown(entry.content),
      }
    })
    window.electronAPI.saveFile(JSON.stringify(output), 'json')
  } catch (error) {
    logger('Error:')
    logger(error)
  }
}

const ImportExportTabContent = () => {
  logger('ImportExport re-render')
  const { userEntries } = useEntriesContext()
  const { session } = useUserContext()

  useEffect(() => {
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'settings view-tab',
      properties: { tab: 'export' },
    })
  }, [])

  const exportTxtHandler = () => {
    exportTxt(userEntries.current)
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'settings export-journal',
      properties: { format: 'txt' },
    })
  }

  const exportJsonHandler = () => {
    exportJson(userEntries.current)
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'settings export-journal',
      properties: { format: 'json' },
    })
  }

  return (
    <>
      <SectionTitleStyled>Export</SectionTitleStyled>
      <WrapperStyled>
        <TitleStyled>Export all Journal entries as markdown:</TitleStyled>
        <TextStyled>
          You own your data and you can download it any time.
          <br />
          All entries are automatically synced with the cloud, so you don't have to make backups.
        </TextStyled>
        <ButtonsWrapperStyled>
          <ButtonStyled onClick={() => exportTxtHandler()}>Journal.txt ↓</ButtonStyled>
          <ButtonStyled onClick={() => exportJsonHandler()}>Journal.json ↓</ButtonStyled>
        </ButtonsWrapperStyled>
      </WrapperStyled>
    </>
  )
}

export { ImportExportTabContent }
