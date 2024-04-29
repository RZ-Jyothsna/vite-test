import { ComponentPropsWithRef } from 'react';

export interface ImageProps extends ComponentPropsWithRef<'img'> {
  src: string;
  alt: string;
}

export interface StructTechBubblesFeatured {
  props: StructTechBubblesFeaturedProps;
}

export interface StructTechBubblesFeaturedProps {
  techBubbleBackgroundImage: null;
  techBubbles: StructTechBubble[] | null;
}

export interface StructTechBubbleProps {
  id: string;
  title: string | null;
  description: string | null;
  image: null;
  xCoordinate: string | null;
  yCoordinate: string | null;
}

export interface StructTechBubble {
  props: StructTechBubbleProps;
}


export type BubbletState = 'show' | 'close' | undefined;

export interface TechBubbleProps {
  techBubble: StructTechBubble;
  bubbleState?: BubbletState;
  updateActiveBubble: (id: string, state: BubbletState, isManual?: boolean) => void;
  techImage?: JSX.Element;
}

export interface FeaturedTechBubblesProps {
  backgroundImage?: ImageProps;
  techImage?: JSX.Element;
  item: StructTechBubblesFeatured;
  techBubbles: StructTechBubble[];
  images?: Record<string, JSX.Element>;
}