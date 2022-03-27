import React, { useState, useEffect } from 'react'
import { useFloating, shift, flip } from '@floating-ui/react-dom'
import { Icon } from './Icon'
import {
  ELEMENT_DEFAULT,
  ELEMENT_PARAGRAPH,
  ELEMENT_H1,
  usePlateEditorRef,
  getPluginType,
  getParent,
} from '@udecode/plate'
import {
  getPreventDefaultHandler,
  someNode,
  toggleNodeType,
  useEventPlateId,
  usePlateEditorState,
} from '@udecode/plate-core'
import styled from 'styled-components'

const Dropdown = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;

  border-radius: 6px;
  background-color: white;
`

interface ItemProps {
  current: boolean
}

const Item = styled.button<ItemProps>`
  font-weight: ${(props) => (props.current ? '700' : 'normal')};
`

export const BlockTypeSelect = () => {
  const editorRef = usePlateEditorRef()
  const [isHidden, setIsHidden] = useState(true)
  const id = useEventPlateId()
  const editor = usePlateEditorState(id)
  const sel = useFloating({
    placement: 'bottom-start',
    middleware: [shift()],
  })

  const parent = getParent(editor, editor?.selection?.anchor)
  const node = parent && Array.isArray(parent) ? parent[0] : null

  const typeH1 = getPluginType(editorRef, ELEMENT_H1)
  const typeP = getPluginType(editorRef, ELEMENT_PARAGRAPH)

  const toggleDropdown = (e: any) => {
    e.preventDefault()
    setIsHidden(!isHidden)
  }

  const markH1 = (e: any) => {
    setIsHidden(true)
    if (editor) {
      getPreventDefaultHandler(toggleNodeType, editor, {
        activeType: typeH1,
        inactiveType: '',
      })(e)
    }
  }

  const markP = (e: any) => {
    setIsHidden(true)
    if (editor) {
      getPreventDefaultHandler(toggleNodeType, editor, {
        activeType: typeP,
        inactiveType: '',
      })(e)
    }
  }

  const isCurrent = (type: any) => {
    let current = !!editor?.selection && someNode(editor, { match: { type } })
    console.log(`isCurrent ${current}`)
    return current
  }

  const nodeFullName = (nodeType: string) => {
    switch (nodeType) {
      case 'p':
        return 'Text'
      case 'h1':
        return 'Header 1'
      default:
        return 'Text'
    }
  }

  return (
    <>
      <button onMouseDown={toggleDropdown} ref={sel.reference}>
        {nodeFullName(node?.type)}
      </button>
      {!isHidden && (
        <Dropdown
          ref={sel.floating}
          style={{
            position: sel.strategy,
            top: sel.y ?? '',
            left: sel.x ?? '',
          }}
        >
          <Item onMouseDown={markP} current={isCurrent(typeP)}>
            Text
          </Item>
          <Item onMouseDown={markH1} current={isCurrent(typeH1)}>
            Header 1
          </Item>
        </Dropdown>
      )}
    </>
  )
}
