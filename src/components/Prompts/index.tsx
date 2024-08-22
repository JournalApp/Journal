import React, { useState, useEffect } from 'react';
import { supabase, logger } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useUserContext } from '@/context';
import {
  useFloating,
  useInteractions,
  useDismiss,
  useClick,
  FloatingPortal,
} from '@floating-ui/react';
import {
  PromptStyled,
  PromptsButtonStyled,
  PromptsCloseButtonStyled,
  PromptTitleStyled,
  PromptContentStyled,
  PromptWindowStyled,
  ChevronStyled,
} from './styled';
import { MDXRemote } from 'next-mdx-remote';
import type { Prompt } from '@/types';
import type { PromptsOpen, PromptSelectedId } from '@/config';

const fetchPrompts = async () => {
  const { data, error } = await supabase.from<Prompt>('prompts').select();
  if (error) {
    throw new Error(error.message);
  }
  // await awaitTimeout(5000)
  await Promise.all(
    data.map(
      async (prompt) =>
        (prompt.content = await window.electronAPI.mdxSerialize(prompt.content ?? '')),
    ),
  );
  return data;
};

const getCachedPrompts = () => {
  const data = window.electronAPI.app.getKey('prompts');
  if (data) {
    try {
      return JSON.parse(data) as Prompt[];
    } catch (error) {
      logger(error);
      return null;
    }
  } else {
    return null;
  }
};

const cachePrompts = (prompts: Prompt[]) => {
  try {
    window.electronAPI.app.setKey({ prompts: JSON.stringify(prompts) });
  } catch (e) {
    logger(e);
  }
};

const components = {
  p: (props: any) => <p {...props} />,
};

interface PromptsProps {
  initialPromptsOpen: PromptsOpen;
  initialPromptSelectedId: PromptSelectedId;
}

const Prompts = ({ initialPromptsOpen, initialPromptSelectedId }: PromptsProps) => {
  const [open, setOpen] = useState<PromptsOpen>(initialPromptsOpen);
  const [beforeOpen, setBeforeOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<PromptSelectedId>(initialPromptSelectedId);
  const { session } = useUserContext();

  const { data: prompts } = useQuery({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
    initialData: getCachedPrompts,
    onSuccess: (data) => cachePrompts(data),
    enabled: open == 'opened',
  });

  useEffect(() => {
    if (prompts && Array.isArray(prompts)) {
      if (!prompts.some((prompt) => prompt.id == selectedId)) {
        setSelectedId(1);
      }
    }
  }, [prompts]);

  useEffect(() => {
    logger(`Prompts ${open ? 'open' : 'close'}`);
  }, [open]);

  const { refs, context } = useFloating({
    open: expanded,
    onOpenChange: setExpanded,
  });

  const { getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, {
      escapeKey: true,
    }),
  ]);

  const selectPrompt = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    logger(`selectPrompt ${id}`);
    if (expanded) {
      setSelectedId(id);
      setExpanded(false);
      window.electronAPI.preferences.set(session.user.id, { promptSelectedId: `${id}` });
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'prompts select',
        properties: { id },
      });
    }
  };

  const openPrompts = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const action: PromptsOpen = 'opened';
    setOpen(action);
    window.electronAPI.preferences.set(session.user.id, { promptsOpen: action });
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'prompts toggle',
      properties: { action },
    });
  };

  const closePrompts = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const action: PromptsOpen = 'closed';
    setBeforeOpen(false);
    setTimeout(() => {
      setOpen('closed');
      setBeforeOpen(true);
    }, 400);
    window.electronAPI.preferences.set(session.user.id, { promptsOpen: action });
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'prompts toggle',
      properties: { action },
    });
  };

  const expandPromptsList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'prompts expand',
    });
  };

  return (
    <>
      <PromptsButtonStyled onMouseDown={(e) => openPrompts(e)}>Prompts</PromptsButtonStyled>
      <FloatingPortal>
        {open == 'opened' && prompts && (
          <PromptWindowStyled
            isExpanded={expanded}
            beforeOpen={beforeOpen}
            ref={refs.setFloating}
            {...getFloatingProps()}
          >
            {prompts.map((prompt) => {
              return (
                <PromptStyled
                  onMouseDown={(e) => selectPrompt(e, prompt.id)}
                  isExpanded={expanded}
                  isSelected={prompt.id == selectedId}
                  isVisible={expanded || prompt.id == selectedId}
                  key={prompt.id}
                >
                  <PromptTitleStyled
                    isExpanded={expanded}
                    isVisible={expanded || prompt.id == selectedId}
                    onMouseDown={(e) => expandPromptsList(e)}
                  >
                    <div>{prompt.title}</div>
                    {!expanded && <ChevronStyled />}
                  </PromptTitleStyled>
                  <PromptContentStyled
                    isExpanded={expanded}
                    isVisible={expanded || prompt.id == selectedId}
                  >
                    <MDXRemote {...prompt.content} components={components} />
                  </PromptContentStyled>
                </PromptStyled>
              );
            })}
            <PromptsCloseButtonStyled onMouseDown={(e) => closePrompts(e)}>
              Hide
            </PromptsCloseButtonStyled>
          </PromptWindowStyled>
        )}
      </FloatingPortal>
    </>
  );
};

export { Prompts };
