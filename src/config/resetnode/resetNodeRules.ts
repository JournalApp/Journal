import {
  ELEMENT_PARAGRAPH,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  isSelectionAtBlockStart,
} from '@udecode/plate'

const resetBlockTypesCommonRule = {
  types: [ELEMENT_H1, ELEMENT_H2, ELEMENT_H3],
  defaultType: ELEMENT_PARAGRAPH,
}

export const resetNodeRules = {
  options: {
    rules: [
      {
        ...resetBlockTypesCommonRule,
        hotkey: 'Backspace',
        predicate: isSelectionAtBlockStart,
      },
    ],
  },
}
