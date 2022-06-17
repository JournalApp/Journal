import React from 'react'
import { useEntriesContext } from 'context'
import { theme } from 'themes'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { ordinal, breakpoints } from 'utils'
import { Icon } from 'components'

const AsideItem = styled.p`
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
`
const AsideItemLabel = styled.p`
  padding: 0 0 16px 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 12px;
  font-weight: 300;
  line-height: 16px;
`

const AsideDay = styled.p`
  padding: 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
`

const AsideYear = styled.p`
  padding: 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 12px;
  font-weight: 300;
  line-height: 20px;
`

const AsideMeta = styled.div`
  opacity: 0;
  top: 0;
  right: 0;
  position: absolute;
  transition: ${theme('animation.time.normal')};
`

const AsideMain = styled.div`
  transition: ${theme('animation.time.normal')};
`

const AsideStickyContainer = styled.div`
  position: sticky;
  top: 48px;
  text-align: end;
`

const Aside = styled.div`
  width: 200px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  & ${AsideMeta} {
    opacity: 0;
    right: 8px;
  }
  & ${AsideMain} {
    opacity: 1;
    right: 0;
  }
  &:hover {
    & ${AsideMeta} {
      opacity: 1;
      right: 0;
    }
    & ${AsideMain} {
      opacity: 0;
      margin-right: 8px;
    }
  }
  @media ${breakpoints.s} {
    display: none;
  }
`

const AsideMenu = styled.div`
  width: 40px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  @media ${breakpoints.s} {
    display: none;
  }
`

const AsideMenuStickyContainer = styled.div`
  position: sticky;
  top: 48px;
  text-align: center;
`

const Remove = styled((props) => <Icon {...props} />)`
  position: sticky;
  top: 48px;
  -webkit-app-region: no-drag;
  cursor: pointer;
  right: -27px;
  top: 3px;
  opacity: 0.5;
  transition: opacity ${theme('animation.time.normal')};
  &:hover {
    opacity: 0.8;
  }
`

const isToday = (day: any) => {
  return day.toString() == dayjs().format('YYYY-MM-DD')
}

const showDate = (day: any) => {
  if (isToday(day)) {
    return (
      <>
        <AsideDay>Today</AsideDay>
        <AsideYear>{dayjs(dayjs(day.toString(), 'YYYY-MM-DD')).format('D MMMM YYYY')}</AsideYear>
      </>
    )
  } else {
    return (
      <>
        <AsideDay>{dayjs(dayjs(day.toString(), 'YYYY-MM-DD')).format('D MMMM')}</AsideDay>
        <AsideYear>{dayjs(dayjs(day.toString(), 'YYYY-MM-DD')).format('YYYY')}</AsideYear>
      </>
    )
  }
}

type EntryAsideProps = {
  date: string
  wordCount: number
}

function EntryAside({ date, wordCount }: EntryAsideProps) {
  const { daysCache, removeCachedDay } = useEntriesContext()

  const removeDay = (date: string) => {
    console.log(`removeDay ${date}`)
    removeCachedDay(date)
  }

  const dayCountOrdinar = () => {
    let count = daysCache.findIndex((d: any) => d == date) + 1
    return ordinal(count)
  }

  return (
    <>
      <Aside>
        <AsideStickyContainer>
          <AsideMain>{showDate(date)}</AsideMain>
          <AsideMeta>
            <AsideItem>{dayCountOrdinar()}</AsideItem>
            <AsideItemLabel>day</AsideItemLabel>
            <AsideItem>{wordCount}</AsideItem>
            <AsideItemLabel>{wordCount == 1 ? 'word' : 'words'}</AsideItemLabel>
          </AsideMeta>
        </AsideStickyContainer>
      </Aside>
      <AsideMenu>
        <AsideMenuStickyContainer>
          {wordCount == 0 && !isToday(date) && (
            <Remove name='Cross' size={16} onClick={() => removeDay(date)} />
          )}
        </AsideMenuStickyContainer>
      </AsideMenu>
    </>
  )
}

export { EntryAside }
