import React, { useState, useEffect, useRef } from 'react'
import { SectionTitleStyled } from '../styled'
import { Features } from './Features'
import { Products } from './Products'

const UpgradeTabContent = () => {
  return (
    <>
      <SectionTitleStyled>Upgrade your plan</SectionTitleStyled>
      <Products />
      <Features />
    </>
  )
}

export { UpgradeTabContent }
