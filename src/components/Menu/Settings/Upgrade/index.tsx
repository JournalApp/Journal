import React, { useState, useEffect, useRef } from 'react'
import { SectionTitleStyled } from '../styled'
import { Features } from './Features'
import { Products } from './Products'
import { useUserContext } from 'context'

const UpgradeTabContent = () => {
  const { session, subscription } = useUserContext()

  useEffect(() => {
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'settings view-tab',
      properties: { tab: 'upgrade' },
    })
  }, [])

  return (
    <>
      <SectionTitleStyled>
        {subscription == null ? 'Upgrade your plan' : 'Plans'}
      </SectionTitleStyled>
      <Products />
      <Features />
    </>
  )
}

export { UpgradeTabContent }
