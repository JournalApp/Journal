import React, { useEffect, useRef, useState } from 'react'
import { theme } from 'themes'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { ordinal, breakpoints, logger, arrayEquals } from 'utils'
import { Icon, EntryTags } from 'components'
import { useUserContext, useEntriesContext } from 'context'

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
  top: 0;
  right: 0;
  text-align: -webkit-right;
  transition: ${theme('animation.time.normal')};
  padding-top: 8px;
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
  width: 160px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
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
  const { setDaysCacheStreak, removeCachedDay, setDaysWithNoContent } = useEntriesContext()
  const [streak, setStreak] = useState(0)
  const lastWordCount = useRef(0)

  useEffect(() => {
    setDaysCacheStreak.current[date] = setStreak
    if (wordCount == 0) {
      logger(`No content on ${date}`)
      setDaysWithNoContent.current((prev: string[]) => {
        return [...prev, date]
      })
    }
  }, [])

  useEffect(() => {
    if (lastWordCount.current == 0 && wordCount != 0) {
      logger('changed to has content')
      setDaysWithNoContent.current((prev: string[]) => {
        return prev.filter((day: string) => {
          return day != date
        })
      })
    } else if (lastWordCount.current != 0 && wordCount == 0) {
      logger('changed to has no content')
      setDaysWithNoContent.current((prev: string[]) => {
        return [...new Set([...prev, date])]
      })
    }
    lastWordCount.current = wordCount
  }, [wordCount])

  return (
    <>
      <Aside>
        <AsideStickyContainer>
          <AsideMain>{showDate(date)}</AsideMain>
          <AsideMeta>
            <EntryTags date={date} />
            {/* <AsideItem>{ordinal(streak)}</AsideItem>
            <AsideItemLabel>day</AsideItemLabel>
            <AsideItem>{wordCount}</AsideItem>
            <AsideItemLabel>{wordCount == 1 ? 'word' : 'words'}</AsideItemLabel> */}
          </AsideMeta>
        </AsideStickyContainer>
      </Aside>
      <AsideMenu>
        <AsideMenuStickyContainer>
          {wordCount == 0 && !isToday(date) && (
            <Remove name='Cross' size={16} onClick={() => removeCachedDay(date)} />
          )}
        </AsideMenuStickyContainer>
      </AsideMenu>
    </>
  )
}

export { EntryAside }
