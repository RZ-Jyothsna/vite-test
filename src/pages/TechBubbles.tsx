import { useState, useEffect, useMemo, useRef } from 'react';
import cls from './TechBubbles.module.scss';
import { TechBubbleProps, BubbletState, FeaturedTechBubblesProps } from './types';

export function FeaturedTechBubbleItem(
  { techBubble, bubbleState, updateActiveBubble, techImage }: TechBubbleProps
) {
  const [showContent, setShowContent] = useState<BubbletState>();
  const [isHover, setIsHover] = useState<boolean>(false);

  useEffect(() => {
    setShowContent(bubbleState);
    if (bubbleState === 'show' && !isHover) {
      setTimeout(() => {
        updateActiveBubble(id, 'close');
      }, 3000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbleState, isHover])

  const item = (techBubble) ? techBubble.props : null;
  if (!item) return;
  const { id, title, description, xCoordinate, yCoordinate } = item;

  if (!xCoordinate || !yCoordinate) return;

  // Limiting the bubble location to 98% of the screen
  const loc: [number, number] = [Math.min(Number(xCoordinate), 98), Math.min(Number(yCoordinate), 98)]

  const limit = 50;

  function getStyle(loc: [number, number]) {
    let style = {};
    if (loc[0] >= limit && loc[1] >= limit) {
      style = { bottom: '0px', top: 'unset', left: 'unset', right: '0px', transformOrigin: "bottom right" }
    } else if (loc[1] >= limit) {
      style = { bottom: '0px', top: 'unset', transformOrigin: "bottom left" };
    }
    else if (loc[0] >= limit) {
      style = { left: 'unset', right: '0px', transformOrigin: "top right" }
    }
    return style;
  }

  function getAnimationType() {
    if (loc[1] >= limit && loc[0] <= limit) {
      return "fixBottomLeft"
    } else if (loc[1] >= limit && loc[0] >= limit) {
      return "fixBottomRight"
    } else if (loc[0] >= limit) {
      return "fixTopRight"
    } else {
      return "fixTopLeft"
    }
  }

  return (
    <div className={cls.bubbleContainer} style={{
      "--left": `${loc[0] >= limit ? 'unset' : `${loc[0]}%`}`,
      "--right": `${loc[0] >= limit ? `${100 - loc[0]}%` : 'unset'}`,
      "--top": `${loc[1] >= limit ? 'unset' : `${loc[1]}%`}`,
      "--bottom": `${loc[1] >= limit ? `${100 - loc[1]}%` : 'unset'}`,
      "--flexDirection": loc[0] >= limit ? 'row-reverse' : 'row',
    } as React.CSSProperties}>
      <div className={cls.bubble}
        onMouseOver={() => {
          updateActiveBubble(id, 'show', true);
          setIsHover(true);
        }}
        onMouseLeave={() => {
          updateActiveBubble(id, 'close', true);
          setIsHover(false);
        }}
        onTouchEnd={() => {
          if (showContent === 'show') {
            updateActiveBubble(id, 'close', true);
            setIsHover(false);
          } else {
            updateActiveBubble(id, 'show', true);
            setIsHover(true);
          }
        }}
      >
        <div data-bubble-active={showContent === 'show' && "active"} />
      </div>
      <div>
        <div className={showContent ? (showContent === 'show' ? cls.heading : `${cls.heading} ${cls.animateHeading}`) : cls.heading}
          data-animation-type={showContent !== 'show' ? getAnimationType() : ''}
          style={getStyle(loc)}
        >
          {title}
        </div>
        <div className={showContent ? (showContent === 'show' ? cls.showContent : cls.closeContent) : cls.hide}
          style={getStyle(loc)}
        >
          <div className={cls.contentBox}>
            {description && (
              <div>description</div>
            )}
            <div>
              {techImage && (
                techImage
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export default function FeaturedTechBubbles({
  techImage, backgroundImage, techBubbles
}: FeaturedTechBubblesProps) {

  const [activeBubble, setActiveBubble] = useState<string | undefined>();
  const [closeBubble, setCloseBubble] = useState<string | undefined>();

  // to handle the manual hover
  const manualHoverRef = useRef<string | undefined>();

  // to handle the quick hover and unhover
  const activeBubbleRef = useRef<string | undefined>(activeBubble);
  const BubbleContainerRef = useRef<HTMLDivElement | null>(null);

  // array of ids of the bubbles
  const bubbles = useMemo(() => techBubbles.map((data) => data.props.id), [techBubbles]);

  function triggerBubbles(entries: IntersectionObserverEntry[]) {
    const [entry] = entries;
    if (entry.isIntersecting) {
      setActiveBubble(bubbles[0]);
      activeBubbleRef.current = bubbles[0];
    } else {
      setActiveBubble(undefined);
      activeBubbleRef.current = undefined;
    }
  }

  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3
  }

  useEffect(() => {
    // observer to trigger the bubble auto hover
    const observer = new IntersectionObserver(triggerBubbles, options);
    const bubbleContainer = BubbleContainerRef.current;
    if (bubbleContainer) {
      observer.observe(bubbleContainer)
    }

    return () => {
      if (bubbleContainer) {
        observer.unobserve(bubbleContainer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateActiveBubble(id: string, state: BubbletState, isManual?: boolean) {
    if (!isManual && manualHoverRef.current) {
      return;
    }

    // update manual hover
    if (isManual && state === 'show') {
      manualHoverRef.current = id;
    } else if (isManual && state === 'close') {
      manualHoverRef.current = undefined;
    }

    if (state === 'show') {
      setActiveBubble(id);
      activeBubbleRef.current = id;
      setCloseBubble(activeBubble);
    } else if (activeBubble && activeBubbleRef?.current === id && state === 'close') {
      setCloseBubble(id);
      // setting next bubble as active bubble
      const bubbleIndex = bubbles.indexOf(activeBubble);
      setActiveBubble(() => {
        return bubbleIndex < bubbles.length - 1 ? bubbles[bubbleIndex + 1] : bubbles[0];
      })
      activeBubbleRef.current = bubbleIndex < bubbles.length - 1 ? bubbles[bubbleIndex + 1] : bubbles[0];
    }
  }

  return (
    <div className={`${cls.techBubbles} container`}>

      <div className={cls.col1} ref={BubbleContainerRef}>
        <div className={cls.bubblesWrapper}>
          {(techBubbles || []).map((data) => (
            <FeaturedTechBubbleItem
              key={data.props.id}
              techBubble={{ ...data }}
              techImage={techImage}
              bubbleState={activeBubble === data.props.id ? 'show' : closeBubble === data.props.id ? 'close' : undefined}
              updateActiveBubble={updateActiveBubble}
            />
          ))}
        </div>
      </div>
      <div className={cls.col2}>
        {backgroundImage && (
          <img {...backgroundImage} />
        )}
      </div>
    </div>
  );
}