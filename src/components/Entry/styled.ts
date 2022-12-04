import styled from 'styled-components'
import { theme } from 'themes'
import { breakpoints } from 'utils'

const Container = styled.div`
  display: flex;
  padding: 32px 0 32px 40px;
  word-break: break-word;
  @media ${breakpoints.s} {
    padding: 16px 24px;
  }
`

const MainWrapper = styled.div`
  width: min-content;
  contain: layout;
  flex-grow: 1;
  padding: 0 80px 0 0;
  font-size: ${theme('appearance.fontSize')};
  font-family: ${theme('appearance.fontFace')};
  font-weight: 500;
  line-height: 30px;
  -webkit-app-region: no-drag;
  & > div:nth-child(2) > h1:first-child,
  & > div:nth-child(2) > h2:first-child,
  & > div:nth-child(2) > h3:first-child,
  & > div:nth-child(2) > div:first-child > h1:first-child,
  & > div:nth-child(2) > div:first-child > h2:first-child,
  & > div:nth-child(2) > div:first-child > h3:first-child {
    margin-block-start: 0;
  }
  & > * {
    max-width: 75ch;
    color: ${theme('color.primary.main')};
  }
  @media ${breakpoints.s} {
    padding: 0;
  }
`
const MiniDate = styled.div`
  padding: 0 0 8px 0;
  margin: 0;
  opacity: 0.3;
  visibility: ${theme('appearance.miniDatesVisibility')};
  color: ${theme('color.primary.main')};
  font-size: 12px;
  font-family: 'Inter var';
  line-height: 16px;
`

const LimitReachedWrapperStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const LimitReachedTextStyled = styled.div`
  opacity: 0.4;
`

const UpgradeButtonStyled = styled.button`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  padding: 2px 8px;
  color: ${theme('color.primary.main')};
  border: 1px solid ${theme('color.primary.main')};
  border-radius: 6px;
  width: fit-content;
  background: transparent;
  cursor: pointer;
  outline: 0;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 3px ${theme('color.primary.main', 0.2)};
    transition: box-shadow ${theme('animation.time.normal')} ease;
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

export {
  Container,
  MainWrapper,
  MiniDate,
  UpgradeButtonStyled,
  LimitReachedTextStyled,
  LimitReachedWrapperStyled,
}
