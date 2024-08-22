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

const LeftPanel = () => {
  return (
    <LeftPanelStyled>
      Upgrade,
      <em>
        <br />
        write
        <br />
        without
        <br />
        limits
      </em>
    </LeftPanelStyled>
  );
};

export { LeftPanel };
