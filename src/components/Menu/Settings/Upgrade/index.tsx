import React, { useState, useEffect, useRef } from 'react'
import { SectionTitleStyled } from '../styled'
import { Features } from './Features'
import { Products } from './Products'
import { useUserContext } from 'context'

const UpgradeTabContent = () => {
  const { subscription } = useUserContext()
  return (
    <>
      <SectionTitleStyled>
        {subscription.current == null ? 'Upgrade your plan' : 'Plans'}
      </SectionTitleStyled>
      <Products />
      <Features />
    </>
  )
}

export { UpgradeTabContent }
