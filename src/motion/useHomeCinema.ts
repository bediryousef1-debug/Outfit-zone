import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type HomeRootRef = RefObject<HTMLElement | null>;

function splitHeadingWords(heading: HTMLElement) {
  const originalHtml = heading.innerHTML;
  const originalAriaLabel = heading.getAttribute('aria-label');
  const label = heading.textContent?.replace(/\s+/gu, ' ').trim() ?? '';

  if (!label) return null;

  const pieces = (heading.textContent ?? '').split(/(\s+)/u);
  const fragment = document.createDocumentFragment();

  pieces.forEach((piece) => {
    if (!piece) return;
    if (/^\s+$/u.test(piece)) {
      fragment.append(document.createTextNode(piece));
      return;
    }

    const mask = document.createElement('span');
    mask.className = 'oz-cinema-word-mask';
    const word = document.createElement('span');
    word.className = 'oz-cinema-word';
    word.textContent = piece;
    mask.append(word);
    fragment.append(mask);
  });

  heading.setAttribute('aria-label', label);
  heading.replaceChildren(fragment);

  return () => {
    heading.innerHTML = originalHtml;
    if (originalAriaLabel === null) heading.removeAttribute('aria-label');
    else heading.setAttribute('aria-label', originalAriaLabel);
  };
}

function addMagneticHover(card: HTMLElement) {
  const inner = card.querySelector<HTMLElement>(':scope > div:first-child');
  if (!inner) return () => undefined;

  let bounds: DOMRect | null = null;
  const xTo = gsap.quickTo(inner, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(inner, 'y', { duration: 0.35, ease: 'power3.out' });
  const rotateXTo = gsap.quickTo(inner, 'rotationX', { duration: 0.35, ease: 'power3.out' });
  const rotateYTo = gsap.quickTo(inner, 'rotationY', { duration: 0.35, ease: 'power3.out' });

  const onEnter = () => {
    bounds = card.getBoundingClientRect();
  };
  const onMove = (event: PointerEvent) => {
    if (!bounds) bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5;
    const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5;
    xTo(x * 3);
    yTo(y * 2);
    rotateXTo(y * -2.4);
    rotateYTo(x * 3);
  };
  const onLeave = () => {
    bounds = null;
    xTo(0);
    yTo(0);
    rotateXTo(0);
    rotateYTo(0);
  };

  card.addEventListener('pointerenter', onEnter);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerleave', onLeave);
  card.addEventListener('pointercancel', onLeave);

  return () => {
    card.removeEventListener('pointerenter', onEnter);
    card.removeEventListener('pointermove', onMove);
    card.removeEventListener('pointerleave', onLeave);
    card.removeEventListener('pointercancel', onLeave);
    gsap.killTweensOf(inner);
  };
}

export function useHomeCinema(rootRef: HomeRootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const restores: Array<() => void> = [];
    let media: ReturnType<typeof gsap.matchMedia> | null = null;
    const context = gsap.context(() => {
      media = gsap.matchMedia();

      media!.add(
        {
          desktop: '(min-width: 768px)',
          mobile: '(max-width: 767px)',
          motion: '(prefers-reduced-motion: no-preference)',
        },
        (mediaContext) => {
          if (!mediaContext.conditions?.motion) return;

          const hero = root.querySelector<HTMLElement>('.oz-hero-stage');
          const zoneWord = root.querySelector<HTMLElement>('[data-oz-zone-parallax]');
          if (mediaContext.conditions.desktop && hero && zoneWord) {
            gsap.to(zoneWord, {
              yPercent: 28,
              xPercent: 3,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            });

            const hoverCleanups: Array<() => void> = [];
            const cards = root.querySelectorAll<HTMLElement>(
              ':scope > section:nth-of-type(3) .oz-card-hover, :scope > section:nth-of-type(5) [data-oz-motion-card], :scope > section:nth-of-type(5) .oz-card-hover'
            );
            if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
              cards.forEach((card) => hoverCleanups.push(addMagneticHover(card)));
            }

            return () => hoverCleanups.forEach((cleanup) => cleanup());
          }
        }
      );

      const sections = Array.from(
        root.querySelectorAll<HTMLElement>(':scope > section.oz-motion-section')
      );
      sections.slice(2, 6).forEach((section) => {
        section.querySelectorAll<HTMLElement>('h2').forEach((heading) => {
          const restore = splitHeadingWords(heading);
          if (restore) restores.push(restore);
          const words = heading.querySelectorAll<HTMLElement>('.oz-cinema-word');
          if (!words.length) return;

          gsap.fromTo(
            words,
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: 0.62,
              stagger: 0.045,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 84%',
                once: true,
              },
            }
          );
        });
      });

    }, root);

    return () => {
      context.revert();
      media?.revert();
      restores.forEach((restore) => restore());
    };
  }, [rootRef]);
}
