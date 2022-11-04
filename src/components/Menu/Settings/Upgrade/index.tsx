import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'
import * as Switch from '@radix-ui/react-switch'
import * as Accordion from '@radix-ui/react-accordion'
import { SectionTitleStyled } from '../styled'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { nanoid } from 'nanoid'
import { logger, supabase, supabaseUrl, supabaseAnonKey } from 'utils'

const PlansSectionStyled = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 16px;
  margin-bottom: 40px;
`

interface PlanStyledProps {
  bgColor?: string
}

const PlanStyled = styled.div<PlanStyledProps>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: ${(props) => (props.bgColor ? props.bgColor : 'transparent')};
  border-radius: 12px;
  padding: 16px;
`

const PlanTitleStyled = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: -0.03em;
  & sub {
    display: block;
    font-style: normal;
    letter-spacing: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    color: ${theme('color.primary.main', 0.8)};
  }
`

const PlansLimitsBoxStyled = styled.div`
  display: flex;
  gap: 0;
  flex-direction: column;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  padding: 8px 12px 12px 12px;
  border-radius: 8px;
  background-color: ${theme('color.pure', 0.6)};
`

interface PlansProgressBarStyledProps {
  progress?: string
}

const PlansProgressBarStyled = styled.div<PlansProgressBarStyledProps>`
  margin-top: 8px;
  background-color: #dae5d6;
  height: 3px;
  border-radius: 3px;
  & div {
    width: ${(props) => (props.progress ? props.progress : '0')};
    background-color: ${theme('color.popper.main')};
    height: 3px;
    border-radius: 3px;
  }
`

const Infinity = styled.div`
  color: ${theme('color.primary.main', 0.8)};
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  margin-bottom: -4px;
`

const PriceContainerStyled = styled.div`
  display: flex;
  align-items: center;
`

const PriceStyled = styled.div`
  flex-grow: 1;
  font-weight: 500;
  font-size: 14px;
  line-height: 28px;
  letter-spacing: -0.03em;
`

interface SwitchStyledProps {
  turnedOn: boolean
}

const SwitchStyled = styled.div<SwitchStyledProps>`
  display: flex;
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;
  gap: 6px;
  align-items: center;
  padding: 2px 6px;
  height: fit-content;
  border-radius: 100px;
  color: ${(props) =>
    props.turnedOn ? theme('color.primary.main') : theme('color.primary.main', 0.5)};
  transition: all ${theme('animation.time.normal')};
  &:hover {
    background-color: ${theme('color.primary.main', 0.05)};
  }
  & label {
    cursor: pointer;
  }
`

const SwitchBgStyled = styled(Switch.Root)`
  all: unset;
  width: 16px;
  height: 10px;
  background-color: ${theme('color.primary.main', 0.5)};
  border-radius: 100px;
  position: relative;
  &[data-state='checked'] {
    background-color: ${theme('color.primary.main')};
  }
`

const SwitchThumbStyled = styled(Switch.Thumb)`
  display: block;
  width: 6px;
  height: 6px;
  background-color: white;
  border-radius: 100px;
  transition: transform 100ms;
  transform: translateX(2px);
  will-change: transform;
  &[data-state='checked'] {
    transform: translateX(8px);
  }
`

const PrimaryButtonStyled = styled.button`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  cursor: pointer;
  color: ${theme('color.popper.inverted')};
  background-color: ${theme('color.popper.main')};
  display: flex;
  padding: 8px 12px;
  border-radius: 6px;
  width: fit-content;
  border: 0;
  outline: 0;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  &:hover {
    box-shadow: 0 0 0 4px ${theme('color.popper.main', 0.15)};
  }
  &:focus {
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.15)};
  }
`

const SecondaryButtonStyled = styled.button`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: ${theme('color.popper.main')};
  background-color: transparent;
  display: flex;
  padding: 8px 12px;
  border-radius: 6px;
  width: fit-content;
  border: 1px solid ${theme('color.popper.main')};
  outline: 0;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  opacity: 0.8;
`

const H2 = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.03em;
  color: ${theme('color.popper.main')};
  margin-bottom: 16px;
`

const Chevron = styled(Icon)`
  transition: transform ${theme('animation.time.normal')};
  [data-state='open'] & {
    transform: rotate(180deg);
  }
`

const Open = keyframes`
  0% {
    height: 0;
    opacity: 0;
    padding-bottom: 8px;
  }
  100% {
    height: var(--radix-accordion-content-height);
    opacity: 0.8;
    padding-bottom: 16px;
  }
`

const Close = keyframes`
  0% {
    height: var(--radix-accordion-content-height);
    opacity: 0.8;
    padding-bottom: 16px;
  }
  100% {
    height: 0;
    opacity: 0;
    padding-bottom: 8px;
  }
`

const AccordionContent = styled(Accordion.Content)`
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
  opacity: 0.8;
  letter-spacing: normal;
  overflow: hidden;
  &[data-state='open'] {
    animation: ${Open} ${theme('animation.time.normal')} ease-out;
    animation-fill-mode: both;
  }
  &[data-state='closed'] {
    animation: ${Close} ${theme('animation.time.normal')} ease-out;
    animation-fill-mode: both;
  }
`

const AccordionHeader = styled(Accordion.Header)`
  margin: 0;
`

const AccordionTrigger = styled(Accordion.Trigger)`
  display: flex;
  cursor: pointer;
  width: -webkit-fill-available;
  text-align: left;
  background-color: transparent;
  border: 0;
  border-top: 1px solid ${theme('color.popper.border')};
  outline: 0;
  padding: 8px 0;
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
`

const TriggerLabel = styled.span`
  flex-grow: 1;
`

const AccordionItem = styled(Accordion.Item)``

const content = `
  <Acc>
  <AccItem>
  <AccTitle>**AES 256-bit** encryption</AccTitle>
  <AccContent>I'm baby squid migas humblebrag, **authentic** slow-carb hashtag XOXO viral. Etsy meditation raclette photo booth flannel</AccContent>
  </AccItem>
  <AccItem>
  <AccTitle>Cloud sync</AccTitle>
  <AccContent>I'm baby squid migas humblebrag, **authentic** slow-carb hashtag XOXO viral. Etsy meditation raclette photo booth flannel</AccContent>
  </AccItem>
  </Acc>
  `

const components = {
  Acc: (props: any) => <Accordion.Root type='multiple' {...props} />,
  AccItem: (props: any) => <AccordionItem value={nanoid(5)} {...props} />,
  AccTitle: ({ children, ...rest }: any) => (
    <>
      <AccordionHeader {...rest}>
        <AccordionTrigger>
          <TriggerLabel>{children}</TriggerLabel>
          <Chevron name='Chevron' type='down' size={16} />
        </AccordionTrigger>
      </AccordionHeader>
    </>
  ),
  AccContent: (props: any) => <AccordionContent {...props} />,
}

const UpgradeTabContent = () => {
  const [billingYearly, setBillingYearly] = useState(true)
  const [loading, setLoading] = useState(true)

  const source = useRef<MDXRemoteSerializeResult | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('website_pages')
        .select('content')
        .eq('page', 'pricing')
        .single()
      source.current = await window.electronAPI.mdxSerialize(data?.content ?? '')
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <SectionTitleStyled>Upgrade your plan</SectionTitleStyled>
      <PlansSectionStyled>
        <PlanStyled bgColor='#E0ECDB'>
          <PlanTitleStyled>
            Free<sub>Try it out</sub>
          </PlanTitleStyled>
          <PlansLimitsBoxStyled>
            30 entries (8 used)
            <PlansProgressBarStyled progress='25%'>
              <div></div>
            </PlansProgressBarStyled>
          </PlansLimitsBoxStyled>
          <PriceContainerStyled>
            <PriceStyled>$0</PriceStyled>
          </PriceContainerStyled>
          <SecondaryButtonStyled disabled>Current plan</SecondaryButtonStyled>
        </PlanStyled>
        <PlanStyled bgColor='#D8DEFF'>
          <PlanTitleStyled>
            Writer<sub>Write without limits</sub>
          </PlanTitleStyled>
          <PlansLimitsBoxStyled>
            Unlimited entries<Infinity>∞</Infinity>
          </PlansLimitsBoxStyled>
          <PriceContainerStyled>
            <PriceStyled>$4 / month</PriceStyled>
            <SwitchStyled turnedOn={billingYearly}>
              <SwitchBgStyled id='s1' checked={billingYearly} onCheckedChange={setBillingYearly}>
                <SwitchThumbStyled />
              </SwitchBgStyled>
              <label htmlFor='s1'>Billed yearly</label>
            </SwitchStyled>
          </PriceContainerStyled>
          <PrimaryButtonStyled>Upgrade</PrimaryButtonStyled>
        </PlanStyled>
      </PlansSectionStyled>
      <H2>All plans include:</H2>
      {!loading && <MDXRemote {...source.current} components={components} />}
    </>
  )
}

export { UpgradeTabContent }
