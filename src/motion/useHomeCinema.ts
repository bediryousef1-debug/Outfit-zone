import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type HomeRootRef = RefObject<HTMLElement | null>;

interface SplitHeadingRecord {
  heading: HTMLElement;
  originalText: string;
  originalAriaLabel: string | null;
}

function splitHeadingWords(heading: HTMLElement): SplitHeadingRecord | null {
  const originalText = heading.textContent ?? '';
  if (!originalText.trim()) return null;

  const originalAriaLabel = heading.getAttribute('aria-label');
  const fragment = document.createDocumentFragment();
  const tokens = originalText.match(/\s+|[^\s]+/gu) ?? [originalText];

  tokens.forEach((token) => {
    if (/^\s+$/u.test(token)) {
      fragment.append(document.createTextNode(token));
      return;
    }

    const mask = document.createElement('span');
    mask.className = 'oz-cinema-word-mask';
    const word = document.createElement('span');
    word.className = 'oz-cinema-word';
    word.textContent = token;
    mask.append(word);
    fragment.append(mask);
  });

  heading.setAttribute('aria-label', originalText.replace(/\s+/gu, ' ').trim());
  heading.replaceChildren(fragment);
  return { heading, originalText, originalAriaLabel };
}

function restoreHeading(record: SplitHeadingRecord): void {
  const { heading, originalText, originalAriaLabel } = record;
  // React may already have replaced the split spans when the language changed.
  if (heading.querySelector('.oz-cinema-word-mask')) {
    heading.textContent = originalText;
  }
  if (originalAriaLabel === null) heading.removeAttribute('aria-label');
  else heading.setAttribute('aria-label', originalAriaLabel);
}

function addMagneticHover(card: HTMLElement): () => void {
  const inner = card.querySelector<HTMLElement>(':scope > div:first-child');
  if (!inner) return () => undefined;

  const xTo = gsap.quickTo(inner, 'x', { duration: 0.34, ease: 'power3.out' });
  const yTo = gsap.quickTo(inner, 'y', { duration: 0.34, ease: 'power3.out' });
  const rotateXTo = gsap.quickTo(inner, 'rotationX', { duration: 0.34, ease: 'power3.out' });
  const rotateYTo = gsap.quickTo(inner, 'rotationY', { duration: 0.34, ease: 'power3.out' });
  let bounds: DOMRect | null = null;

  const onEnter = () => {
    bounds = card.getBoundingClientRect();
  };
  const onMove = (event: PointerEvent) => {
    if (!bounds) bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5;
    const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5;
    xTo(x * 3.5);
    yTo(y * 2.5);
    rotateXTo(y * -2.6);
    rotateYTo(x * 3.2);
  };
  const onLeave = () => {
    bounds = null;
    xTo(0);
    yTo(0);
    rotateXTo(0);
    rotateYTo(0);
  };

  gsap.set(inner, { transformPerspective: 900, transformOrigin: 'center center' });
  card.addEventListener('pointerenter', onEnter, { passive: true });
  card.addEventListener('pointermove', onMove, { passive: true });
  card.addEventListener('pointerleave', onLeave, { passive: true });
  card.addEventListener('pointercancel', onLeave, { passive: true });

  return () => {
    card.removeEventListener('pointerenter', onEnter);
    card.removeEventListener('pointermove', onMove);
    card.removeEventListener('pointerleave', onLeave);
    card.removeEventListener('pointercancel', onLeave);
    gsap.killTweensOf(inner);
    gsap.set(inner, { clearProps: 'transform' });
  };
}

export function useHomeCinema(rootRef: HomeRootRef, language: string): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(root);
    const context = gsap.context(() => {
      media.add(
        {
          reduce: '(prefers-reduced-motion: reduce)',
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        },
        (mediaContext) => {
          if (mediaContext.conditions?.reduce) return;

          const ownedTriggers: Array<{ kill: () => void }> = [];
          const ownedTweens: Array<{ kill: () => void }> = [];
          const cleanups: Array<() => void> = [];
          const splitRecords: SplitHeadingRecord[] = [];
          const sections = Array.from(
            root.querySelectorAll<HTMLElement>(':scope > section.oz-motion-section')
          );

          sections.slice(2, 6).forEach((section) => {
            section.querySelectorAll<HTMLElement>('h2').forEach((heading) => {
              const record = splitHeadingWords(heading);
              if (!record) return;
              splitRecords.push(record);
              const words = Array.from(
                heading.querySelectorAll<HTMLElement>('.oz-cinema-word')
              );

              const trigger = ScrollTrigger.create({
                trigger: heading,
                start: 'top 86%',
                once: true,
                onEnter: () => {
                  const tween = gsap.fromTo(
                    words,
                    { yPercent: 108, opacity: 0 },
                    {
                      yPercent: 0,
                      opacity: 1,
                      duration: 0.68,
                      stagger: 0.045,
                      ease: 'power3.out',
                      overwrite: 'auto',
                    }
                  );
                  ownedTweens.push(tween);
                },
              });
              ownedTriggers.push(trigger);
            });
          });

          if (mediaContext.conditions?.desktop) {
            const hero = root.querySelector<HTMLElement>('.oz-hero-stage');
            const zoneWord = hero?.querySelector<HTMLElement>('[data-oz-zone-parallax]');

            if (hero && zoneWord) {
              const zoneTween = gsap.to(zoneWord, {
                yPercent: 26,
                ease: 'none',
                paused: true,
              });
              const zoneTrigger = ScrollTrigger.create({
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 1.1,
                animation: zoneTween,
              });
              ownedTweens.push(zoneTween);
              ownedTriggers.push(zoneTrigger);
            }

            if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
              const categorySection = sections[2];
              const productSection = sections[4];
              const cards = [
                ...(categorySection
                  ? Array.from(categorySection.querySelectorAll<HTMLElement>('.oz-card-hover'))
                  : []),
                ...(productSection
                  ? Array.from(productSection.querySelectorAll<HTMLElement>('.oz-card-hover, [data-oz-motion-card]'))
                  : []),
              ];
              cards.forEach((card) => cleanups.push(addMagneticHover(card)));
            }
          }

          return () => {
            cleanups.forEach((cleanup) => cleanup());
            ownedTriggers.forEach((trigger) => trigger.kill());
            ownedTweens.forEach((tween) => tween.kill());
            splitRecords.forEach(restoreHeading);
          };
        }
      );
    }, root);

    return () => {
      media.revert();
      context.revert();
    };
  }, [rootRef, language]);
}
