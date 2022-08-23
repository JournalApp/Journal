import { lightTheme, theme } from 'themes'

type Tag = {
  id: string
  name: string
  color: keyof typeof lightTheme.color.tags
}

export { Tag }
