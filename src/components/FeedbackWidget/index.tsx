import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'
import { RatingEmojiControl } from './RatingEmojiControl'
import { useForm } from 'react-hook-form'
import { supabase, isUnauthorized, logger } from 'utils'
import { useUserContext } from 'context'

const InputContainer = styled.div`
  position: relative;
  display: flex;
`

const Label = styled.label`
  position: absolute;
  padding: 13px 16px 8px 16px;
  border-radius: 12px 0 8px 0;
  top: 0;
  left: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.6;
  font-size: 12px;
  font-weight: 400;
  font-style: normal;
  line-height: 16px;
  white-space: nowrap;
`

const LabelOptional = styled.label`
  position: absolute;
  padding: 4px 8px;
  border-radius: 12px;
  margin: 8px;
  top: 0;
  right: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.4;
  font-size: 12px;
  font-weight: 400;
  font-style: normal;
  line-height: 16px;
  white-space: nowrap;
`

const LabelError = styled.label`
  position: absolute;
  padding: 4px 8px;
  border-radius: 12px;
  margin: 2px ​8px;
  top: 0;
  right: 0;
  color: ${theme('color.error.main')};
  font-size: 12px;
  font-weight: 600;
  font-style: normal;
  line-height: 16px;
  white-space: nowrap;
`

const CTA = styled.button`
  border-radius: 100px;
  outline: 0;
  border: 0;
  background-color: ${theme('color.primary.main')};
  color: ${theme('color.primary.surface')};
  padding: 6px 14px;
  cursor: pointer;
`

interface TextAreaProps {
  rows: any
}

const TextArea = styled.textarea<TextAreaProps>`
  padding: 37px 16px 13px 16px;
  background-color: ${theme('color.popper.surface')};
  color: ${theme('color.primary.main')};
  resize: vertical;
  border: 0;
  border-radius: 8px;
  box-sizing: border-box;
  width: 100%;
  margin: 0 0 1px 0;
  font-size: 16px;
  line-height: 28px;
  font-weight: 400;
  resize: none;
  transition: all ${theme('animation.time.normal')};
  &:focus {
    border: 0;
    background-color: ${theme('color.popper.hover')};
    outline: 0;
    transition: all ${theme('animation.time.normal')};
    & + label {
      opacity: 1;
      transition: all ${theme('animation.time.normal')};
    }
  }
  &:active {
    border: 0;
    transition: all ${theme('animation.time.normal')};
  }
  &:hover {
    transition: all ${theme('animation.time.normal')};
    background-color: ${theme('color.popper.hover')};
    & + label {
      color: ${theme('color.primary.main')};
      transition: all ${theme('animation.time.normal')};
    }
  }
  &::placeholder {
    opacity: 0.6;
  }
`

const Title = styled.h3`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: -0.03em;
  color: ${theme('color.primary.main')};
  margin: 0;
`
const ThankYou = styled.h2`
  font-size: 24px;
  color: ${theme('color.primary.main')};
  display: block;
  font-weight: 500;
  font-style: normal;
  line-height: 32px;
  margin: 32px 0 8px 0;
  letter-spacing: -1px;
`
const Body = styled.p`
  color: ${theme('color.primary.main')};
  font-size: 16px;
  font-weight: 400;
  font-style: normal;
  line-height: 28px;
  opacity: 0.6;
  margin: 0;
`

const RatingInput = styled.input`
  visibility: hidden;
  width: 0;
  height: 0;
  display: none;
`

const reveal = keyframes`
  0% {
    bottom: -100px;
  }
  100% {
    bottom: 0;
  }
`

const FeedbackWidgetContainer = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0 24px;
  animation-name: ${reveal};
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.64, 0.01, 0.71, 1.17);
  animation-fill-mode: both;
`

const GiveFeedbackButton = styled.div`
  position: fixed;
  bottom: 8px;
  right: 8px;
  padding: 2px 6px;
  line-height: 16px;
  border-radius: 100px;
  font-size: 12px;
  background-color: transparent;
  border: 0;
  color: ${theme('color.primary.main')};
  z-index: 100;
  opacity: 0.3;
  outline: 0;
  cursor: pointer;
  transition: all ${theme('animation.time.normal')};
  &:hover {
    opacity: 0.7;
    background-color: ${theme('color.primary.hover')};
  }
`

interface FormProps {
  visible: boolean
}

const FeedbackForm = styled.form<FormProps>`
  -webkit-app-region: no-drag;
  position: absolute;
  bottom: 36px;
  right: 8px;
  color: ${theme('color.primary.main')};
  background-color: ${theme('color.popper.surface')};
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  width: 350px;
  padding: 16px;
  z-index: 9999;
  font-size: 16px;
  font-weight: 600;
  font-style: normal;
  line-height: 28px;
  pointer-events: all;
  visibility: ${(props) => (props.visible ? 'visible' : 'hidden')};
  opacity: ${(props) => (props.visible ? '1' : '0')};
  margin-bottom: ${(props) => (props.visible ? '0' : '-24px')};
  transition: ${(props) =>
    props.visible
      ? 'visibility 0s, opacity 0.2s, margin-bottom 0.2s;'
      : 'visibility 0s linear 0.2s, opacity 0.2s, margin-bottom 0.2s;'};
`

const ThankYouScreen = styled.div<FormProps>`
  -webkit-app-region: no-drag;
  position: absolute;
  bottom: 36px;
  right: 8px;
  color: ${theme('color.primary.main')};
  background-color: ${theme('color.popper.surface')};
  border-radius: 12px;
  box-shadow: 0px 2px 49px -13px rgb(0 0 0 / 12%);
  width: 350px;
  padding: 16px 16px 64px 16px;
  z-index: 9999;
  text-align: center;
  pointer-events: all;
  visibility: hidden;
  visibility: ${(props) => (props.visible ? 'visible' : 'hidden')};
  opacity: ${(props) => (props.visible ? '1' : '0')};
  margin-bottom: ${(props) => (props.visible ? '0' : '-24px')};
  transition: ${(props) =>
    props.visible
      ? 'visibility 0s, opacity 0.2s, margin-bottom 0.2s;'
      : 'visibility 0s linear 0.2s, opacity 0.2s, margin-bottom 0.2s;'};
`

const FormFieldsContainer = styled.div`
  ${InputContainer}:first-child {
    textarea,
    input,
    select {
      border-top-right-radius: 12px;
      border-top-left-radius: 12px;
    }
  }
  ${InputContainer}:last-child {
    textarea,
    input,
    select {
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }
  }
`

const showEmojiRating = keyframes`
  0% {
    height: 0;
    opacity: 0;
  }
  100% {
    height: 100px;
    opacity: 1;
  }
`

const hideEmojiRating = keyframes`
 0% {
  height: 100px;
  opacity: 1;
}
  100% {
    height: 0;
    opacity: 0;
  }
`

interface InputProps {
  visible: boolean
}

const InputContainerAnimated = styled.div<InputProps>`
  position: relative;
  pointer-events: visible;
  display: flex;
  animation-name: ${(props) => (props.visible ? showEmojiRating : hideEmojiRating)};
  animation-duration: 0.2s;
  animation-timing-function: cubic-bezier(0.17, 0.18, 0.41, 0.99);
  animation-fill-mode: both;
`

const FormHeader = styled.div`
  display: grid;
  grid-template-columns: auto 24px;
  column-gap: 8px;
  padding: 8px 8px 0 16px;
`
const FormFooter = styled.div`
  display: grid;
  grid-template-columns: auto 85px;
  column-gap: 8px;
  padding: 16px 0 0 16px;
  align-items: center;
`

const FormErrorMessage = styled.p`
  color: ${theme('color.error.main')};
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  margin: 0;
`

const feedbackTypeMap = {
  experience: {
    title: '😀 Rate my experience',
    isInputRequired: false,
    inputLabel: 'Feedback',
    inputPlaceholder: 'Type your feedback or request here...',
  },
  idea: {
    title: '💡 Propose and idea',
    isInputRequired: true,
    inputLabel: 'Idea',
    inputPlaceholder: 'Type your idea here...',
  },
}

type Keys = keyof typeof feedbackTypeMap
type Values = typeof feedbackTypeMap[Keys]

type FormData = {
  feedbackType: Keys
  rating: string
  feedback: string
}

function FeedbackWidget() {
  const [formVisible, setFormVisible] = useState(false)
  const [formMessage, setFormMessage] = useState([])
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    resetField,
    reset,
    control,
    clearErrors,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({ defaultValues: { feedbackType: 'experience' } })
  const { session, signOut } = useUserContext()

  const watchFeedbackType = watch('feedbackType')

  const submitFeedback = async (data: any) => {
    const grades = ['angry', 'thinking', 'neutral', 'happy', 'love']
    const rating = grades.findIndex((r) => r == data.rating) + 1

    setFormMessage([])
    setFormSubmitting(true)

    let { error } = await supabase
      .from('feedback')
      .insert(
        [
          {
            user_id: session.user.id,
            rating,
            feedback: data.feedback,
          },
        ],
        { returning: 'minimal' }
      )
      .single()

    setFormSubmitting(false)

    if (error) {
      logger(error)
      if (isUnauthorized(error)) signOut()
      setFormMessage(['error', 'Error, try again later'])
    }

    setFormSubmitted(true)
    setFormVisible(false)
  }

  const showForm = (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e?.preventDefault()
    setFormVisible(true)
    setFormSubmitted(false)
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'feedback open',
    })
  }

  const closeForm = (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e?.preventDefault()
    setFormVisible(false)
  }

  const closeThankYou = (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e?.preventDefault()
    setFormSubmitted(false)
  }

  const escFunction = useCallback((event) => {
    if (event.keyCode === 27) {
      closeForm()
      closeThankYou()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', escFunction)
    return () => {
      document.removeEventListener('keydown', escFunction)
    }
  }, [escFunction])

  useEffect(() => {
    resetField('rating')
    clearErrors()
    setFormMessage([])
  }, [watchFeedbackType])

  useEffect(() => {
    setTimeout(() => reset(), 200)
    setFormMessage([])
  }, [formVisible])

  return (
    <FeedbackWidgetContainer>
      <FeedbackForm onSubmit={handleSubmit(submitFeedback)} visible={formVisible}>
        <FormHeader>
          <Title>Give feedback</Title>
          <a href='#' onClick={(e) => closeForm(e)} style={{ height: '24px' }}>
            <Icon name='Cross' />
          </a>
        </FormHeader>
        <FormFieldsContainer>
          <InputContainerAnimated visible={true}>
            <RatingInput
              {...register('rating', {
                required: { value: true, message: 'Required' },
              })}
            />
            <RatingEmojiControl
              shouldReset={!formVisible}
              onClickFunc={(newVal: any) =>
                setValue('rating', newVal, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
            />
            {errors.rating && <LabelError htmlFor='rating'>{errors.rating.message}</LabelError>}
          </InputContainerAnimated>
          <InputContainer>
            <TextArea
              {...register('feedback', {
                required: {
                  value: feedbackTypeMap[watchFeedbackType].isInputRequired,
                  message: 'Required',
                },
              })}
              placeholder={feedbackTypeMap['experience'].inputPlaceholder}
              rows='4'
            ></TextArea>
            <Label htmlFor='feedback'>{feedbackTypeMap[watchFeedbackType].inputLabel}</Label>
            {errors.feedback ? (
              <LabelError htmlFor='feedback'>{errors.feedback.message}</LabelError>
            ) : (
              !feedbackTypeMap[watchFeedbackType].isInputRequired && (
                <LabelOptional>(optional)</LabelOptional>
              )
            )}
          </InputContainer>
        </FormFieldsContainer>
        <FormFooter>
          <FormErrorMessage>{formMessage[1]}</FormErrorMessage>
          <CTA disabled={formSubmitting}>{formSubmitting ? 'Sending...' : 'Send -->'}</CTA>
        </FormFooter>
        {/* <DevTool control={control} /> */}
      </FeedbackForm>
      <ThankYouScreen visible={formSubmitted}>
        <FormHeader>
          <Title></Title>
          <a href='#' onClick={(e) => closeThankYou(e)} style={{ height: '24px' }}>
            <Icon name='Cross' />
          </a>
        </FormHeader>
        <Icon name='RisedHands' />
        <ThankYou>Thank you!</ThankYou>
        <Body>Your feedback was sent</Body>
      </ThankYouScreen>
      <GiveFeedbackButton
        onClick={(e) => {
          showForm(e)
        }}
      >
        Give feedback
      </GiveFeedbackButton>
    </FeedbackWidgetContainer>
  )
}

export { FeedbackWidget }
