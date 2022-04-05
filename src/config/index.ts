import { AutoformatPlugin, ResetNodePlugin, PlatePlugin } from '@udecode/plate'
import { autoformatRules } from './autoformat/autoformatRules'
import { resetNodeRules } from './resetnode/resetNodeRules'

interface Config {
  autoformat: Partial<PlatePlugin<{}, AutoformatPlugin>>
  resetNode: Partial<PlatePlugin<{}, ResetNodePlugin>>
}

export const CONFIG: Config = {
  autoformat: {
    options: {
      rules: autoformatRules,
    },
  },
  resetNode: resetNodeRules,
}
