import React, { ReactPortal, useState, useEffect, useLayoutEffect, forwardRef } from 'react'
import * as ReactDOM from 'react-dom'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Toggle from '@radix-ui/react-toggle'
import { useFloating, shift, offset } from '@floating-ui/react-dom'
import { BaseRange, BasePoint, Transforms, Editor as SlateEditor } from 'slate'
import { Icon, BlockTypeSelect } from 'components'
import { theme } from 'themes'

import {
  MARK_BOLD,
  MARK_UNDERLINE,
  MARK_ITALIC,
  MARK_STRIKETHROUGH,
  MARK_CODE,
  ELEMENT_H1,
  MarkToolbarButton,
  usePlateEditorRef,
  getPluginType,
  getSelectionText,
  isSelectionExpanded,
} from '@udecode/plate'
import {
  getPreventDefaultHandler,
  someNode,
  toggleNodeType,
  toggleMark,
  useEventPlateId,
  usePlateEditorState,
  withPlateEventProvider,
  isMarkActive,
} from '@udecode/plate-core'
import styled, { keyframes } from 'styled-components'

interface WrapperProps {
  posX?: string
  posY?: string
  pos?: string
}

const showToolbar = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const Wrapper = styled.div<WrapperProps>`
  position: ${(props) => (props.pos ? props.pos : 'absolute')};
  top: ${(props) => (props.posY ? props.posY : '')};
  left: ${(props) => (props.posX ? props.posX : '')};
  transition: ${theme('animation.time.fast')};
  animation-name: ${showToolbar};
  animation-duration: ${theme('animation.time.long')};
`

const StyledToolbar = styled(Toolbar.Root)`
  display: flex;
  padding: 4px;
  gap: 8px;
  box-shadow: ${theme('style.shadow')};
  min-width: max-content;
  border-radius: 12px;
  background-color: ${theme('color.neutral.popper')};
`

// const StyledToggle = styled(Toggle.Root)`
//   border-radius: 6px;
//   border: 0;
//   background-color: white;
//   &[data-state='on'] {
//     background-color: silver;
//   }
// `

interface StyledToggleProps {
  toggleOn: boolean
}

const ToggleGroup = styled.div`
  display: flex;
  flex-basis: row;
  border-radius: 8px;

  & > :first-child {
    border-radius: 8px 0 0 8px;
  }

  & > :last-child {
    border-radius: 0 8px 8px 0;
  }
`

const StyledToggle = styled.div<StyledToggleProps>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) =>
    props.toggleOn ? theme('color.neutral.main') : theme('color.neutral.inverted')};
  &:hover {
    background-color: ${(props) =>
      props.toggleOn ? theme('color.neutral.main') : theme('color.neutral.hoverInverted')};
  }
  transition: ${theme('animation.time.normal')};
`

// const StyledContent = styled(Select.Content)`
//   position: static;
//   top: 50px;
//   overflow: hidden;
//   background-color: white;
//   border-radius: 6px;
//   box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
// `

const getSelectionBoundingClientRect = () => {
  const domSelection = window.getSelection()
  if (!domSelection || domSelection.rangeCount < 1) return
  const domRange = domSelection.getRangeAt(0)
  return domRange.getBoundingClientRect()
}

// const BlockTypeSelect = () => {
//   return (
//     <Select.Root>
//       <Select.Trigger onMouseDown={(e) => console.log('Select.Trigger')}>
//         <Select.Value onMouseDown={(e) => console.log('Select.Value')} />
//         <Select.Icon onMouseDown={(e) => console.log('Select.Icon')} />
//       </Select.Trigger>

//       <StyledContent>
//         <Select.Viewport>
//           <Select.Item value='1'>
//             <Select.ItemText>Text</Select.ItemText>
//             <Select.ItemIndicator />
//           </Select.Item>
//           <Select.Item value='2'>
//             <Select.ItemText>Header 1</Select.ItemText>
//             <Select.ItemIndicator />
//           </Select.Item>
//           <Select.Item value='3'>
//             <Select.ItemText>Header 2</Select.ItemText>
//             <Select.ItemIndicator />
//           </Select.Item>
//         </Select.Viewport>
//       </StyledContent>
//     </Select.Root>
//   )
// }

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
]

interface FormatToolbarProps {
  focused: boolean
}

export const FormatToolbar = ({ focused }: FormatToolbarProps) => {
  const editorRef = usePlateEditorRef()
  const editor = usePlateEditorState(useEventPlateId())
  const [isHidden, setIsHidden] = useState(true)
  const selectionExpanded = editor && isSelectionExpanded(editor)
  const selectionText = editor && getSelectionText(editor)
  const { x, y, reference, floating, strategy } = useFloating({
    placement: 'top-start',
    middleware: [shift(), offset({ mainAxis: 8 })],
  })

  // TODO https://github.com/udecode/plate/issues/1352#issuecomment-1056975461
  // useEffect(() => {
  //   if (editor && !editor.selection) {
  //     Transforms.select(editor, SlateEditor.end(editor, []))
  //   }
  // }, [editor])

  useLayoutEffect(() => {
    reference({
      getBoundingClientRect() {
        const { top, right, bottom, left, width, height, x, y } = getSelectionBoundingClientRect()
        return { top, right, bottom, left, width, height, x, y }
      },
    })
    console.log('useLayoutEffect')
  }, [reference, selectionExpanded, selectionText, editor.children])

  useEffect(() => {
    if (!focused) {
      setIsHidden(true)
    } else {
      if (!selectionText) {
        setIsHidden(true)
      } else if (selectionText && selectionExpanded) {
        setIsHidden(false)
      }
    }
  }, [selectionExpanded, selectionText, focused])

  const Toggle = withPlateEventProvider(({ markType, iconName }: any) => {
    const id = useEventPlateId()
    const editor = usePlateEditorState(id)
    const type = getPluginType(editorRef, markType)
    const state = !!editor?.selection && isMarkActive(editor, type!)

    const onMouseDown = (e: any) => {
      if (editor) {
        getPreventDefaultHandler(toggleMark, editor, { key: type, clear: '' })(e)
      }
    }

    return (
      <StyledToggle toggleOn={state} onMouseDown={onMouseDown}>
        <Icon
          name={iconName}
          tintColor={state ? theme('color.neutral.inverted') : theme('color.neutral.main')}
        />
      </StyledToggle>
    )
  })

  // const Mark = withPlateEventProvider(() => {
  //   const id = useEventPlateId()
  //   const editor = usePlateEditorState(id)
  //   const type = getPluginType(editorRef, ELEMENT_H1)

  //   const onPressedChange = (pressed: boolean) => {
  //     console.log(`Pressed: ${pressed}`)
  //   }

  //   const onMouseDown = (e: any) => {
  //     if (editor) {
  //       getPreventDefaultHandler(toggleNodeType, editor, {
  //         activeType: type,
  //         inactiveType: '',
  //       })(e)
  //     }
  //   }

  //   return (
  //     <StyledToggle
  //       on={!!editor?.selection && someNode(editor, { match: { type } })}
  //       onMouseDown={onMouseDown}
  //     >
  //       <Icon name='check24' />
  //     </StyledToggle>
  //   )
  // })

  return (
    !isHidden &&
    ReactDOM.createPortal(
      <Wrapper
        ref={floating}
        posX={`${Math.floor(x)}px`}
        posY={`${Math.floor(y)}px`}
        pos={strategy}
      >
        <StyledToolbar>
          <BlockTypeSelect />
          <ToggleGroup>
            <Toggle markType={MARK_BOLD} iconName='FormatBold' />
            <Toggle markType={MARK_ITALIC} iconName='FormatItalic' />
            <Toggle markType={MARK_UNDERLINE} iconName='FormatUnderline' />
            <Toggle markType={MARK_STRIKETHROUGH} iconName='FormatStriketrough' />
            <Toggle markType={MARK_CODE} iconName='FormatCode' />
          </ToggleGroup>
        </StyledToolbar>
      </Wrapper>,
      document.body
    )
  )
}
