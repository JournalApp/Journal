import React, { FormEvent } from 'react'
import { CodeAlt } from '@styled-icons/boxicons-regular/CodeAlt'
import { CodeBlock } from '@styled-icons/boxicons-regular/CodeBlock'
import { Highlight } from '@styled-icons/boxicons-regular/Highlight'
import { Subscript } from '@styled-icons/foundation/Subscript'
import { Superscript } from '@styled-icons/foundation/Superscript'
import { BorderAll } from '@styled-icons/material/BorderAll'
import { BorderBottom } from '@styled-icons/material/BorderBottom'
import { BorderClear } from '@styled-icons/material/BorderClear'
import { BorderLeft } from '@styled-icons/material/BorderLeft'
import { BorderRight } from '@styled-icons/material/BorderRight'
import { BorderTop } from '@styled-icons/material/BorderTop'
import { FormatAlignCenter } from '@styled-icons/material/FormatAlignCenter'
import { FormatAlignJustify } from '@styled-icons/material/FormatAlignJustify'
import { FormatAlignLeft } from '@styled-icons/material/FormatAlignLeft'
import { FormatAlignRight } from '@styled-icons/material/FormatAlignRight'
import { FormatBold } from '@styled-icons/material/FormatBold'
import { FormatIndentDecrease } from '@styled-icons/material/FormatIndentDecrease'
import { FormatIndentIncrease } from '@styled-icons/material/FormatIndentIncrease'
import { FormatItalic } from '@styled-icons/material/FormatItalic'
import { FormatListBulleted } from '@styled-icons/material/FormatListBulleted'
import { FormatListNumbered } from '@styled-icons/material/FormatListNumbered'
import { FormatQuote } from '@styled-icons/material/FormatQuote'
import { FormatStrikethrough } from '@styled-icons/material/FormatStrikethrough'
import { FormatUnderlined } from '@styled-icons/material/FormatUnderlined'
import { Keyboard } from '@styled-icons/material/Keyboard'
import { Looks3 } from '@styled-icons/material/Looks3'
import { Looks4 } from '@styled-icons/material/Looks4'
import { Looks5 } from '@styled-icons/material/Looks5'
import { Looks6 } from '@styled-icons/material/Looks6'
import { LooksOne } from '@styled-icons/material/LooksOne'
import { LooksTwo } from '@styled-icons/material/LooksTwo'
import { Check } from '@styled-icons/material/Check'
import styled from 'styled-components'
// import { Icon } from './Icon'
import * as Select from '@radix-ui/react-select'

import {
  addColumn,
  addRow,
  BalloonToolbar,
  deleteColumn,
  deleteRow,
  deleteTable,
  ELEMENT_BLOCKQUOTE,
  ELEMENT_CODE_BLOCK,
  ELEMENT_DEFAULT,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
  ELEMENT_OL,
  ELEMENT_UL,
  getPluginType,
  getPreventDefaultHandler,
  indent,
  insertTable,
  MARK_BG_COLOR,
  MARK_BOLD,
  MARK_CODE,
  MARK_COLOR,
  MARK_HIGHLIGHT,
  MARK_ITALIC,
  MARK_KBD,
  MARK_STRIKETHROUGH,
  MARK_SUBSCRIPT,
  MARK_SUPERSCRIPT,
  MARK_UNDERLINE,
  outdent,
  AlignToolbarButton,
  ToolbarButton,
  CodeBlockToolbarButton,
  ColorPickerToolbarDropdown,
  BlockToolbarButton,
  ImageToolbarButton,
  LinkToolbarButton,
  ListToolbarButton,
  MarkToolbarButton,
  MediaEmbedToolbarButton,
  TableToolbarButton,
  ToolbarDropdown,
  usePlateEditorRef,
  getParent,
  toggleNodeType,
} from '@udecode/plate'
import { Link } from '@styled-icons/material/Link'
import { Image } from '@styled-icons/material/Image'
import { OndemandVideo } from '@styled-icons/material/OndemandVideo'
import { FontDownload } from '@styled-icons/material/FontDownload'
import { FormatColorText } from '@styled-icons/material/FormatColorText'

const H1Item = styled.span`
  color: 'currentColor';
`

export const BasicElementToolbarButtons = () => {
  const editor = usePlateEditorRef()

  return (
    <>
      <BlockToolbarButton type={getPluginType(editor, ELEMENT_DEFAULT)} icon={<H1Item>P</H1Item>} />
      <BlockToolbarButton type={getPluginType(editor, ELEMENT_H1)} icon={<H1Item>H1</H1Item>} />
      <BlockToolbarButton type={getPluginType(editor, ELEMENT_H2)} icon={<H1Item>H2</H1Item>} />
      <BlockToolbarButton type={getPluginType(editor, ELEMENT_H3)} icon={<H1Item>H3</H1Item>} />
      <BlockToolbarButton
        type={getPluginType(editor, ELEMENT_BLOCKQUOTE)}
        icon={<H1Item>Quote</H1Item>}
      />
      <ListToolbarButton type={getPluginType(editor, ELEMENT_UL)} icon={<H1Item>UL</H1Item>} />
      <ListToolbarButton type={getPluginType(editor, ELEMENT_OL)} icon={<H1Item>OL</H1Item>} />
    </>
  )
}

export const BasicMarkToolbarButtons = () => {
  const editor = usePlateEditorRef()

  return (
    <>
      <MarkToolbarButton type={getPluginType(editor, MARK_BOLD)} icon={<FormatBold />} />
      <MarkToolbarButton type={getPluginType(editor, MARK_ITALIC)} icon={<FormatItalic />} />
      <MarkToolbarButton type={getPluginType(editor, MARK_UNDERLINE)} icon={<FormatUnderlined />} />
      <MarkToolbarButton
        type={getPluginType(editor, MARK_STRIKETHROUGH)}
        icon={<FormatStrikethrough />}
      />
      <MarkToolbarButton type={getPluginType(editor, MARK_CODE)} icon={<CodeAlt />} />
      <MarkToolbarButton type={getPluginType(editor, MARK_HIGHLIGHT)} icon={<Highlight />} />
    </>
  )
}

const elementOptions = [
  { type: ELEMENT_DEFAULT, label: 'Normal' },
  { type: ELEMENT_H1, label: 'Heading 1' },
  { type: ELEMENT_H2, label: 'Heading 2' },
  { type: ELEMENT_H3, label: 'Heading 3' },
]

const LevelSelect = () => {
  const editor = usePlateEditorRef()
  const parent = getParent(editor, editor?.selection?.anchor)
  const node = parent && Array.isArray(parent) ? parent[0] : null

  return (
    <select
      id='level'
      name='level'
      onChange={(e: FormEvent<HTMLSelectElement>) =>
        toggleNodeType(editor, {
          activeType: e.currentTarget.value,
          inactiveType: ELEMENT_DEFAULT,
        })
      }
      onClick={(e: FormEvent<HTMLSelectElement>) => e.stopPropagation()}
      value={node?.type}
    >
      {elementOptions.map((option) => (
        <option value={option.type} key={option.type}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

const NewSelect = () => {
  return (
    <div onMouseDown={(e) => console.log('div')}>
      <Select.Root>
        <Select.Trigger onMouseDown={(e) => console.log('Select.Trigger')}>
          <Select.Value onMouseDown={(e) => console.log('Select.Value')} />
          <Select.Icon onMouseDown={(e) => console.log('Select.Icon')} />
        </Select.Trigger>

        <Select.Content>
          <Select.Viewport>
            <Select.Item value='1'>
              <Select.ItemText>Text</Select.ItemText>
              <Select.ItemIndicator />
            </Select.Item>
            <Select.Item value='2'>
              <Select.ItemText>Header 1</Select.ItemText>
              <Select.ItemIndicator />
            </Select.Item>
            <Select.Item value='3'>
              <Select.ItemText>Header 2</Select.ItemText>
              <Select.ItemIndicator />
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
      </Select.Root>
    </div>
  )
}

export const FormatToolbar = () => {
  const arrow = false
  const theme = 'light'
  const tooltip: any = {
    arrow: true,
    delay: 0,
    duration: [200, 0],
    hideOnClick: false,
    offset: [0, 17],
    placement: 'top',
  }

  return (
    <BalloonToolbar
      popperOptions={{
        placement: 'top',
      }}
      theme={theme}
      arrow={arrow}
    >
      Hello
      <NewSelect />
      <LevelSelect />
      <BasicElementToolbarButtons />
      <BasicMarkToolbarButtons />
      <LinkToolbarButton icon={<Link />} />
    </BalloonToolbar>
  )
}
