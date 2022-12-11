import React, { useEffect, useRef, useState } from 'react'
import { theme } from 'themes'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { ordinal, breakpoints, logger, arrayEquals } from 'utils'
import { Icon, EntryTags } from 'components'
import { useEntriesContext } from 'context'
import { EntryMenu } from './EntryMenu'

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
  padding-top: 24px;
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
  -webkit-app-region: no-drag;
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
  padding-bottom: 6px;
  display: flex;
  flex-direction: column;
  @media ${breakpoints.s} {
    display: none;
  }
`

const AsideMenuStickyContainer = styled.div`
  position: sticky;
  -webkit-app-region: no-drag;
  top: 48px;
  display: flex;
  justify-content: center;
`

const Trigger = styled((props) => <Icon {...props} />)`
  -webkit-app-region: no-drag;
  opacity: 0.5;
  transition: opacity ${theme('animation.time.normal')};
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
  wordCount: React.MutableRefObject<number>
  freePlanLimitReached: boolean
}

function EntryAside({ date, wordCount, freePlanLimitReached }: EntryAsideProps) {
  return (
    <>
      <Aside>
        <AsideStickyContainer>
          <AsideMain>{showDate(date)}</AsideMain>
          <AsideMeta>{!freePlanLimitReached && <EntryTags date={date} />}</AsideMeta>
        </AsideStickyContainer>
      </Aside>
      <AsideMenu>
        <AsideMenuStickyContainer>
          <EntryMenu
            wordCount={wordCount}
            date={date}
            renderTrigger={() => <Trigger name='Chevron' size={8} />}
          />
        </AsideMenuStickyContainer>
      </AsideMenu>
    </>
  )
}

export { EntryAside }
