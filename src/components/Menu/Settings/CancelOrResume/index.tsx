import React, { useState, useEffect } from 'react';
import { theme } from '@/themes';
import { logger } from '@/utils';
import {
  useFloating,
  FloatingOverlay,
  useInteractions,
  useDismiss,
  useClick,
  FloatingFocusManager,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useUserContext } from '@/context';
import {
  cancelSubscription,
  getSubscription,
  resumeSubscription,
} from '../../../../context/UserContext/subscriptions';
import {
  ModalStyled,
  ButtonDestructiveStyled,
  ButtonStyled,
  ButtonGhostStyled,
  TitleStyled,
  DescriptionStyled,
  ActionsWrapperStyled,
} from './styled';
import dayjs from 'dayjs';

interface CancelOrResumeProps {
  action: 'cancel' | 'resume';
  renderTrigger: any;
}

const CancelOrResume = ({ action, renderTrigger }: CancelOrResumeProps) => {
  logger('CancelOrResume rerender');
  const { session, subscription } = useUserContext();
  const [isCancelingOrResuming, setIsCancelingOrResuming] = useState(false);
  const [isCanceledOrResumed, setIsCanceledOrResumed] = useState(false);
  const [poolingSubscription, setPoolingSubscription] = useState(false);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const nodeId = useFloatingNodeId();

  useQuery({
    queryKey: ['subscription', session?.user.id],
    queryFn: async () => {
      setPoolingSubscription(true);
      logger('setPoolingSubscription(true)');
      return await getSubscription(session?.user.id, session.access_token);
    },
    refetchInterval: (data) => {
      logger(data);
      const cancel_at_period_end = action == 'cancel' ? true : false;
      if (data?.status == 'active' && data?.cancel_at_period_end == cancel_at_period_end) {
        logger('Subscription with cancel_at_period_end received!');
        setPoolingSubscription(false);
        setSuccess(true);
        return false;
      } else {
        logger('No subscription with cancel_at_period_end...');
        return 2000;
      }
    },
    refetchIntervalInBackground: true,
    enabled: isCanceledOrResumed == true,
  });

  const { context, refs } = useFloating({
    open,
    onOpenChange: setOpen,
    nodeId,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, {
      escapeKey: false,
    }),
  ]);

  const handleCloseEsc = (e: any) => {
    if (e.key == 'Escape') {
      if (refs.floating.current && refs.floating.current.contains(document.activeElement)) {
        setOpen(false);
      }
    }
  };

  useEffect(() => {
    logger('✅ addEventListener');
    document.addEventListener('keydown', handleCloseEsc);

    return () => {
      logger('❌ removeEventListener');
      document.removeEventListener('keydown', handleCloseEsc);
    };
  }, []);

  useEffect(() => {
    if (success) {
      setOpen(false);
    }
  }, [success]);

  useEffect(() => {
    if (open) {
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'settings billing plan',
        properties: { action },
      });
    }
  }, [open]);

  const cancelOrResume = async () => {
    setIsCancelingOrResuming(true);
    try {
      if (action == 'cancel') {
        await cancelSubscription({
          access_token: session.access_token,
          subscriptionId: subscription.id,
        });
      }
      if (action == 'resume') {
        await resumeSubscription({
          access_token: session.access_token,
          subscriptionId: subscription.id,
        });
      }
      setIsCanceledOrResumed(true);
      setIsCancelingOrResuming(false);
    } catch (error) {
      logger(error);
      setIsCancelingOrResuming(false);
      setIsCanceledOrResumed(false);
    }
  };

  const cancelButtonText = () => {
    if (success) {
      return 'Done';
    } else if (poolingSubscription) {
      return 'Finalizing...';
    } else if (isCancelingOrResuming) {
      return 'Canceling...';
    } else {
      return 'Cancel plan';
    }
  };

  const resumeButtonText = () => {
    if (success) {
      return 'Done';
    } else if (poolingSubscription) {
      return 'Finalizing...';
    } else if (isCancelingOrResuming) {
      return 'Resuming...';
    } else {
      return 'Resume plan';
    }
  };

  const planInterval = () => {
    if (subscription?.prices?.interval) {
      return `${subscription.prices.interval}ly`;
    } else {
      return '';
    }
  };

  return (
    <FloatingNode id={nodeId}>
      {renderTrigger({ open: () => setOpen(true), ref: refs.setReference, ...getReferenceProps() })}
      <FloatingPortal>
        {open && (
          <FloatingOverlay
            lockScroll
            style={{
              display: 'grid',
              placeItems: 'center',
              background: theme('color.primary.surface', 0.8),
              zIndex: 1010,
            }}
          >
            <FloatingFocusManager context={context} initialFocus={0}>
              <ModalStyled ref={refs.setFloating} {...getFloatingProps()}>
                {/* <IconCloseStyled onClick={() => setOpen(false)} /> */}
                {action == 'cancel' && (
                  <>
                    <TitleStyled>Oh no, cancel your plan?</TitleStyled>
                    <DescriptionStyled>
                      If you proceed with canceling your {planInterval()} plan, it will still remain
                      active utill {dayjs(subscription.current_period_end).format('MMM D, YYYY')}.
                    </DescriptionStyled>
                    <ActionsWrapperStyled>
                      <ButtonDestructiveStyled
                        onClick={() => cancelOrResume()}
                        disabled={poolingSubscription || isCancelingOrResuming}
                      >
                        {cancelButtonText()}
                      </ButtonDestructiveStyled>
                      <ButtonStyled
                        onClick={() => setOpen(false)}
                        disabled={poolingSubscription || isCancelingOrResuming}
                      >
                        Keep plan
                      </ButtonStyled>
                    </ActionsWrapperStyled>
                  </>
                )}
                {action == 'resume' && (
                  <>
                    <TitleStyled>Yeah, resume your plan?</TitleStyled>
                    <DescriptionStyled>
                      If you proceed with resuming your {planInterval()} plan, your next billing
                      will be on {dayjs(subscription.current_period_end).format('MMM D, YYYY')}.
                    </DescriptionStyled>
                    <ActionsWrapperStyled>
                      <ButtonGhostStyled
                        onClick={() => setOpen(false)}
                        disabled={poolingSubscription || isCancelingOrResuming || success}
                      >
                        Cancel
                      </ButtonGhostStyled>
                      <ButtonStyled
                        onClick={() => cancelOrResume()}
                        disabled={poolingSubscription || isCancelingOrResuming || success}
                      >
                        {resumeButtonText()}
                      </ButtonStyled>
                    </ActionsWrapperStyled>
                  </>
                )}
              </ModalStyled>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  );
};

export { CancelOrResume };
