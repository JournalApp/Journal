import styled from 'styled-components'
import { theme } from 'themes'

const BeforeEntries = styled.div`
  text-align: center;
  padding: 64px 0;
`

const PostEntries = styled.div`
  min-height: calc(100vh - 150px);
`

const Wrapper = styled.div`
  width: 100vw;
  margin-left: ${theme('appearance.entriesOffset')};
  transition: margin-left ${theme('animation.time.normal')};
  display: flex;
  flex-flow: column;
  flex-direction: column-reverse;
`

export { BeforeEntries, PostEntries, Wrapper }
