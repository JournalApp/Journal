import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '@/themes';
import { Icon } from '@/components';
import * as Accordion from '@radix-ui/react-accordion';
import { MDXRemote } from 'next-mdx-remote';
import { nanoid } from 'nanoid';
import { logger, supabase } from '@/utils';
import Skeleton from 'react-loading-skeleton';
import { useQuery } from '@tanstack/react-query';
import { useUserContext } from '@/context';
import { onlyText } from 'react-children-utilities';

const Chevron = styled(Icon)`
  transition: transform ${theme('animation.time.normal')};
  [data-state='open'] & {
    transform: rotate(180deg);
  }
`;

const AccordionItem = styled(Accordion.Item)``;

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
`;

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
`;

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
`;

const AccordionHeader = styled(Accordion.Header)`
  margin: 0;
`;

const AccordionTrigger = styled(Accordion.Trigger)`
  display: flex;
  color: ${theme('color.popper.main')};
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
`;

const TriggerLabel = styled.span`
  flex-grow: 1;
`;

const H2 = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.03em;
  color: ${theme('color.popper.main')};
  margin-bottom: 16px;
  margin-top: 25px;
`;

const SkeletonContainer = styled.div`
  display: block;
  & span {
    margin: 4px 0;
  }
`;

const fetchFeaturesAndFAQ = async () => {
  const { data, error } = await supabase
    .from('website_pages')
    .select('content')
    .eq('page', 'pricing')
    .single();
  if (error) {
    throw new Error(error.message);
  }
  // await awaitTimeout(2000)
  return await window.electronAPI.mdxSerialize(data?.content ?? '');
};

const Features = () => {
  logger('Features rerender');
  const { session } = useUserContext();
  const { isLoading, isError, data } = useQuery({
    queryKey: ['features'],
    queryFn: fetchFeaturesAndFAQ,
  });

  const captureAccordionClick = (item: string) => {
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'settings upgrade feature-expand',
      properties: { item },
    });
  };

  const components = {
    h2: (props: any) => <H2 {...props} />,
    Acc: (props: any) => <Accordion.Root type='multiple' {...props} />,
    AccItem: (props: any) => <AccordionItem value={nanoid(5)} {...props} />,
    AccTitle: ({ children, ...rest }: any) => (
      <>
        <AccordionHeader onClick={() => captureAccordionClick(onlyText(children))} {...rest}>
          <AccordionTrigger>
            <TriggerLabel>{children}</TriggerLabel>
            <Chevron name='Chevron' type='down' size={16} />
          </AccordionTrigger>
        </AccordionHeader>
      </>
    ),
    AccContent: (props: any) => <AccordionContent {...props} />,
  };

  if (isLoading) {
    return (
      <SkeletonContainer>
        <Skeleton
          count={5}
          height={20}
          baseColor={theme('color.popper.hover')}
          highlightColor={theme('color.popper.surface')}
          enableAnimation={false}
        />
      </SkeletonContainer>
    );
  }

  if (isError) {
    return <></>;
  }

  return <MDXRemote {...data} components={components} />;
};

export { Features };
