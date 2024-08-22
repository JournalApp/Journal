import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Icon } from '@/components';

interface RatingEmojiContainerProps {
  borderRadius?: string
}

const RatingEmojiContainer = styled.div<RatingEmojiContainerProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-evenly;
  border: 0;
  border-radius: ${(props) => props.borderRadius || '0'};
  box-sizing: border-box;
  padding: 24px;
  width: 100%;
  margin: 0 0 1px 0;
  & svg {
    transition: 0.1s ease-out;
    padding: 8px;
  }
`;

const emojiJump = keyframes`
  0% {
    transform: scale(1.4);
  }
  50% {
    transform: scale(1.5) translateY(-10px);
  }
  100% {
    transform: scale(1.4);
  }
`;

const IconEmoji = styled((props) => <Icon {...props} />)`
  cursor: pointer;
  &:focus {
    outline: none;
    animation-name: ${emojiJump};
    animation-duration: 0.4s;
    animation-timing-function: cubic-bezier(0.17, 0.18, 0.41, 0.99);
    animation-fill-mode: both;
  }
`;

type RatingEmojiControlProps = {
  onClickFunc: (type: string) => void
  shouldReset: boolean
  // cachedEntry?: any
  // ref?: any
  // setEntryHeight: (id: string, height: number) => void
  // setCachedEntry: (property: string, value: any) => void
  // shouldScrollToDay: (day: string) => boolean
  // clearScrollToDay: () => void
};

function RatingEmojiControl({ onClickFunc, shouldReset }: RatingEmojiControlProps) {
  const emojis = ['angry', 'thinking', 'neutral', 'happy', 'love'];

  const [hover, setHover] = useState('');
  const [selected, setSelected] = useState('');

  function whatStyle(type: string) {
    if (hover) {
      if (hover == type) {
        return { transform: 'scale(1.4)' };
      } else {
        return { transform: 'scale(1)' };
      }
    }
    if (selected) {
      if (selected == type) {
        return { transform: 'scale(1.4)' };
      } else {
        return { opacity: '0.5' };
      }
    }
  }

  function onClick(type: string) {
    setSelected(type);
    onClickFunc(type);
  }

  function onKeyPress(e: React.KeyboardEvent<HTMLElement>, type: string) {
    if (e.key == 'Enter') {
      setSelected(type);
      onClickFunc(type);
    }
  }

  useEffect(() => {
    setSelected('');
  }, [shouldReset]);

  return (
    <RatingEmojiContainer>
      {/* {console.count('Render count:')} */}
      {emojis.map((type, i) => (
        <IconEmoji
          tabIndex={0}
          name='RatingEmoji'
          type={type}
          style={whatStyle(type)}
          onClick={() => onClick(type)}
          onKeyPress={(e: any) => onKeyPress(e, type)}
          onMouseEnter={() => setHover(type)}
          onMouseLeave={() => setHover('')}
          key={`emojiRating-${i}`}
        />
      ))}
    </RatingEmojiContainer>
  );
}

export { RatingEmojiControl };
