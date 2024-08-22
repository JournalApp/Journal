import React from 'react';
import styled from 'styled-components';
import { theme } from '@/themes';



const LeftPanelStyled = styled.div`
  width: 260px;
  color: ${theme('color.primary.main')};
  font-weight: 500;
  font-size: 21px;
  line-height: 26px;
  & em {
    opacity: 0.6;
    font-style: normal;
  }
`;
interface LeftPanelProps {
  saving: string
}

const LeftPanel = ({ saving }: LeftPanelProps) => {
  return (
    <LeftPanelStyled>
      Give yourself
      <br />
      whole year
      <br />
      of writing,
      <br />
      <em>{`save ${saving}`}</em>
    </LeftPanelStyled>
  );
};

export { LeftPanel };
