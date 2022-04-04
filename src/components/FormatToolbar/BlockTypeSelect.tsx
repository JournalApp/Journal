import React, { useState, useEffect } from 'react'
import { useFloating, shift, offset } from '@floating-ui/react-dom'
import { Icon, BlockTypeSelectItem } from 'components'
import { theme } from 'themes'
import styled, { keyframes } from 'styled-components'
import {
  ELEMENT_DEFAULT,
  ELEMENT_PARAGRAPH,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_OL,
  ELEMENT_UL,
  usePlateEditorRef,
  getPluginType,
  getParent,
  getListItemEntry,
  toggleList,
} from '@udecode/plate'
import {
  getPreventDefaultHandler,
  someNode,
  toggleNodeType,
  useEventPlateId,
  usePlateEditorState,
} from '@udecode/plate-core'

interface BlockTypeSelectButtonProps {
  isHidden?: boolean
}

const Divider = styled.div`
  background-color: ${theme('color.neutral.border')};
  height: 1px;
  margin: 8px 12px;
`

const BlockTypeSelectButton = styled.button<BlockTypeSelectButtonProps>`
  height: 36px;
  display: flex;
  border: 0;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) =>
    props.isHidden ? theme('color.neutral.popper') : theme('color.neutral.active')};
  &:hover {
    background-color: ${theme('color.neutral.hoverInverted')};
  }
  transition: ${theme('animation.time.normal')};
`

const showDropdown = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const Dropdown = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px;
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.neutral.popper')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
`

export const BlockTypeSelect = () => {
  const editorRef = usePlateEditorRef()
  const [isHidden, setIsHidden] = useState(true)
  const id = useEventPlateId()
  const editor = usePlateEditorState(id)
  const sel = useFloating({
    placement: 'bottom-start',
    middleware: [shift(), offset({ crossAxis: -4, mainAxis: 8 })],
  })

  const parent = getParent(editor, editor?.selection?.anchor)
  const node = parent && Array.isArray(parent) ? parent[0] : null

  const res = !!editor?.selection && getListItemEntry(editor)
  const list = !!res ? res.list[0].type : null

  const typeH1 = getPluginType(editorRef, ELEMENT_H1)
  const typeH2 = getPluginType(editorRef, ELEMENT_H2)
  const typeH3 = getPluginType(editorRef, ELEMENT_H3)
  const typeOL = getPluginType(editorRef, ELEMENT_OL)
  const typeUL = getPluginType(editorRef, ELEMENT_UL)
  const typeP = getPluginType(editorRef, ELEMENT_PARAGRAPH)

  const toggleDropdown = (e: any) => {
    e.preventDefault()
    setIsHidden(!isHidden)
  }

  const markList = (type: string, e: any) => {
    setIsHidden(true)
    if (editor) {
      getPreventDefaultHandler(toggleList, editor, { type })(e)
    }
  }

  const mark = (type: string, e: any) => {
    if (list) {
      // first toggle of existing list
      markList(list, e)
    }
    setIsHidden(true)
    if (editor) {
      getPreventDefaultHandler(toggleNodeType, editor, {
        activeType: type,
      })(e)
    }
  }

  const isCurrent = (type: any) => {
    let current = !!editor?.selection && someNode(editor, { match: { type } })
    console.log(`isCurrent ${current}`)
    return current
  }

  const isCurrentList = (type: any) => {
    const res = !!editor?.selection && getListItemEntry(editor)
    let current = !!res && res.list[0].type === type
    console.log(`isCurrent ${current}`)
    return current
  }

  const nodeFullName = (nodeType: string) => {
    console.log(nodeType)
    console.log(list)
    if (nodeType == 'lic') {
      switch (list) {
        case 'ol':
          return <Icon name='BlockNumList' />
        case 'ul':
          return <Icon name='BlockBulletList' />
        default:
          return <Icon name='BlockNumList' />
      }
    } else {
      switch (nodeType) {
        case 'p':
          return <Icon name='BlockText' />
        case 'h1':
          return <Icon name='BlockH1' />
        case 'h2':
          return <Icon name='BlockH2' />
        case 'h3':
          return <Icon name='BlockH3' />
        default:
          return <Icon name='BlockText' />
      }
    }
  }

  return (
    <>
      <BlockTypeSelectButton onMouseDown={toggleDropdown} ref={sel.reference} isHidden={isHidden}>
        {nodeFullName(node?.type)}
        <Icon name='Chevron' type={isHidden ? 'down' : 'up'} />
      </BlockTypeSelectButton>
      {!isHidden && (
        <Dropdown
          ref={sel.floating}
          style={{
            position: sel.strategy,
            top: sel.y ?? '',
            left: sel.x ?? '',
          }}
        >
          <BlockTypeSelectItem
            onMouseDown={(e) => mark(typeP, e)}
            current={isCurrent(typeP)}
            icon='BlockText'
          >
            Text
          </BlockTypeSelectItem>
          <Divider />
          <BlockTypeSelectItem
            onMouseDown={(e) => mark(typeH1, e)}
            current={isCurrent(typeH1)}
            icon='BlockH1'
          >
            Heading 1
          </BlockTypeSelectItem>
          <BlockTypeSelectItem
            onMouseDown={(e) => mark(typeH2, e)}
            current={isCurrent(typeH2)}
            icon='BlockH2'
          >
            Heading 2
          </BlockTypeSelectItem>
          <BlockTypeSelectItem
            onMouseDown={(e) => mark(typeH3, e)}
            current={isCurrent(typeH3)}
            icon='BlockH3'
          >
            Heading 3
          </BlockTypeSelectItem>
          <Divider />
          <BlockTypeSelectItem
            onMouseDown={(e) => markList(typeOL, e)}
            current={isCurrentList(typeOL)}
            icon='BlockNumList'
          >
            Numbered list
          </BlockTypeSelectItem>
          <BlockTypeSelectItem
            onMouseDown={(e) => markList(typeUL, e)}
            current={isCurrentList(typeUL)}
            icon='BlockBulletList'
          >
            Bullet list
          </BlockTypeSelectItem>
        </Dropdown>
      )}
    </>
  )
}
