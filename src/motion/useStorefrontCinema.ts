import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './storefront-cinema.css';

const PAGE_WORDS: Record<string, string> = {
  '/products': 'SHOP',
  '/about': 'ABOUT',
  '/contact': 'CONTACT',
  '/cart': 'CART',
  '/checkout': 'CHECKOUT',
  '/track': 'TRACK',
};

function pageKey(pathname: string): string {
  if (pathname.startsWith('/products/')) return 'PRODUCT';
  if (pathname.startsWith('/order-success/')) return 'SUCCESS';
  if (pathname === '/track') return 'TRACK';
  return PAGE_WORDS[pathname] || '';
}

function splitWords(heading: HTMLElement) {
  if (heading.children.length || !heading.textContent?.trim()) return null;
  const originalNodes = Array.from(heading.childNodes).map((node) => node.cloneNode(true));
  const originalLabel = heading.getAttribute('aria-label');
  const text = heading.textContent || '';
  const fragment = document.createDocumentFragment();
  text.match(/\s+|[^\s]+/gu)?.forEach((token) => {
    if (/^\s+$/u.test(token)) {
      fragment.append(document.createTextNode(token));
      return;
    }
    const mask = document.createElement('span');
    mask.className = 'oz-page-word-mask';
    const word = document.createElement('span');
    word.className = 'oz-page-word';
    word.textContent = token;
    mask.append(word);
    fragment.append(mask);
  });
  heading.setAttribute('aria-label', text.replace(/\s+/gu, ' ').trim());
  heading.replaceChildren(fragment);
  return () => {
    heading.replaceChildren(...originalNodes.map((node) => node.cloneNode(true)));
    if (originalLabel === null) heading.removeAttribute('aria-label');
    else heading.setAttribute('aria-label', originalLabel);
  };
}

/** Shared inner-page intro, scenes and small interaction feedback. Reuses the app's GSAP/ScrollTrigger/Lenis setup. */
export function useStorefrontCinema(pathname: string): void {
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const root = document.querySelector<HTMLElement>('.oz-route-motion-root');
    if (!root) return;
    const isInnerPage = pathname !== '/' && root.classList.contains('oz-page-motion');

    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const label = isInnerPage ? pageKey(pathname) : '';
    let refreshTimer = 0;

    const heading = root.querySelector<HTMLElement>('h1');
    if (heading && label) {
      const host = heading.parentElement;
      if (host) {
        host.classList.add('oz-page-intro-host');
        host.setAttribute('data-oz-outline-word', label);
        const rule = document.createElement('span');
        rule.className = 'oz-page-intro-rule';
        rule.setAttribute('aria-hidden', 'true');
        host.append(rule);
        cleanups.push(() => {
          rule.remove();
          host.classList.remove('oz-page-intro-host');
          host.removeAttribute('data-oz-outline-word');
        });
      }

      if (!reduced) {
        const restore = splitWords(heading);
        if (restore) {
          cleanups.push(restore);
          const words = Array.from(heading.querySelectorAll<HTMLElement>('.oz-page-word'));
          tweens.push(gsap.fromTo(words, { yPercent: 112 }, {
            yPercent: 0,
            duration: 0.62,
            stagger: 0.035,
            ease: 'power3.out',
            delay: 0.08,
            clearProps: 'transform',
          }));
        } else {
          tweens.push(gsap.fromTo(heading, { y: 18 }, {
            y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform',
          }));
        }
        const host = heading.parentElement;
        const rule = host?.querySelector<HTMLElement>('.oz-page-intro-rule');
        if (rule) {
          gsap.set(rule, { scaleX: 0, transformOrigin: document.documentElement.dir === 'rtl' ? 'right center' : 'left center' });
          tweens.push(gsap.to(rule, { scaleX: 1, duration: 0.72, delay: 0.18, ease: 'power3.out' }));
        }
        const hostElement = heading.parentElement;
        if (hostElement && window.matchMedia('(min-width: 768px)').matches) {
          const parallax = gsap.to(hostElement, { '--oz-page-parallax': '22px', ease: 'none', paused: true });
          const trigger = ScrollTrigger.create({
            trigger: hostElement,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1,
            animation: parallax,
          });
          tweens.push(parallax);
          triggers.push(trigger);
        }
      }
    }

    if (!reduced && isInnerPage) {
      // Mark existing editorial sections and major div-based page blocks without replacing markup or layout.
      const markedScenes = Array.from(root.querySelectorAll<HTMLElement>('[data-oz-scene]'))
        .filter((scene) => scene.parentElement !== root);
      const scenes = Array.from(new Set([
        ...root.querySelectorAll<HTMLElement>('section, [data-oz-scroll-scene]'),
        ...markedScenes,
        ...root.querySelectorAll<HTMLElement>(':scope > div > div'),
      ]));
      scenes.forEach((scene) => {
        if (!scene.hasAttribute('data-oz-scene')) {
          scene.setAttribute('data-oz-scene', '');
          cleanups.push(() => scene.removeAttribute('data-oz-scene'));
        }
        const copy = Array.from(scene.querySelectorAll<HTMLElement>('p')).slice(0, 4);
        if (copy.length) {
          const tween = gsap.fromTo(copy, { y: 14 }, {
            y: 0,
            duration: 0.58,
            stagger: 0.07,
            ease: 'power3.out',
            clearProps: 'transform',
            scrollTrigger: { trigger: scene, start: 'top 82%', once: true },
          });
          tweens.push(tween);
          if (tween.scrollTrigger) triggers.push(tween.scrollTrigger as ScrollTrigger);
        }
      });

      // Product filters can change without a route remount; only animate image children, never card roots.
      let productGridTween: gsap.core.Tween | null = null;
      const tiltCleanups = new Map<HTMLElement, () => void>();
      const applyProductImageTilts = () => {
        if (!window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches) return;
        const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-oz-motion-card]')).slice(0, 16);
        tiltCleanups.forEach((cleanup, card) => {
          if (!card.isConnected || !cards.includes(card)) {
            cleanup();
            tiltCleanups.delete(card);
          }
        });
        cards.forEach((card) => {
          if (tiltCleanups.has(card)) return;
          const image = card.querySelector<HTMLElement>('img');
          if (!image) return;
          const xTo = gsap.quickTo(image, 'x', { duration: 0.28, ease: 'power3.out' });
          const yTo = gsap.quickTo(image, 'y', { duration: 0.28, ease: 'power3.out' });
          const rotateXTo = gsap.quickTo(image, 'rotationX', { duration: 0.28, ease: 'power3.out' });
          const rotateYTo = gsap.quickTo(image, 'rotationY', { duration: 0.28, ease: 'power3.out' });
          let bounds: DOMRect | null = null;
          const onEnter = () => { bounds = card.getBoundingClientRect(); };
          const onMove = (event: PointerEvent) => {
            if (!bounds) return;
            const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5;
            const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5;
            xTo(x * 3.2);
            yTo(y * 2.4);
            rotateXTo(y * -2.2);
            rotateYTo(x * 2.8);
          };
          const onLeave = () => {
            bounds = null;
            xTo(0); yTo(0); rotateXTo(0); rotateYTo(0);
          };
          gsap.set(image, { transformPerspective: 900, transformOrigin: 'center center' });
          card.addEventListener('pointerenter', onEnter, { passive: true });
          card.addEventListener('pointermove', onMove, { passive: true });
          card.addEventListener('pointerleave', onLeave, { passive: true });
          card.addEventListener('pointercancel', onLeave, { passive: true });
          tiltCleanups.set(card, () => {
            card.removeEventListener('pointerenter', onEnter);
            card.removeEventListener('pointermove', onMove);
            card.removeEventListener('pointerleave', onLeave);
            card.removeEventListener('pointercancel', onLeave);
            gsap.killTweensOf(image);
            gsap.set(image, { clearProps: 'transform' });
          });
        });
      };
      const animateProductImages = () => {
        const grid = root.querySelector<HTMLElement>('[class*="grid-cols-2"][class*="sm:grid-cols-3"]');
        if (!grid) return;
        const images = Array.from(grid.querySelectorAll<HTMLElement>('img')).slice(0, 16);
        if (!images.length) return;
        productGridTween?.kill();
        gsap.killTweensOf(images);
        productGridTween = gsap.fromTo(images, { y: 10, scale: 0.985 }, {
          y: 0, scale: 1, duration: 0.36, stagger: 0.025, ease: 'power2.out', clearProps: 'transform',
        });
        applyProductImageTilts();
      };
      if (pathname === '/products') {
        const categoryChips = root.querySelector<HTMLElement>('[data-oz-category-chips]');
        let chipTimer = 0;
        const animateCategoryChips = () => {
          if (reduced || !categoryChips?.isConnected) return;
          const chips = Array.from(categoryChips.querySelectorAll<HTMLElement>('button')).slice(0, 12);
          if (!chips.length) return;
          gsap.killTweensOf(chips);
          gsap.fromTo(chips, { y: 7, scale: 0.97 }, {
            y: 0, scale: 1, duration: 0.24, stagger: 0.025, ease: 'power2.out', clearProps: 'transform',
          });
        };
        const onCategoryClick = (event: Event) => {
          if (!(event.target instanceof Element) || !event.target.closest('button')) return;
          window.clearTimeout(chipTimer);
          chipTimer = window.setTimeout(animateCategoryChips, 45);
        };
        categoryChips?.addEventListener('click', onCategoryClick);
        const chipObserver = categoryChips ? new MutationObserver(() => {
          window.clearTimeout(chipTimer);
          chipTimer = window.setTimeout(animateCategoryChips, 55);
        }) : null;
        chipObserver?.observe(categoryChips!, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        animateCategoryChips();
        let mutationTimer = 0;
        applyProductImageTilts();
        const gridObserver = new MutationObserver(() => {
          window.clearTimeout(mutationTimer);
          mutationTimer = window.setTimeout(animateProductImages, 90);
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 220);
        });
        gridObserver.observe(root, { childList: true, subtree: true });
        cleanups.push(() => {
          window.clearTimeout(chipTimer);
          categoryChips?.removeEventListener('click', onCategoryClick);
          chipObserver?.disconnect();
          window.clearTimeout(mutationTimer);
          gridObserver.disconnect();
          productGridTween?.kill();
          productGridTween = null;
          tiltCleanups.forEach((cleanup) => cleanup());
          tiltCleanups.clear();
        });
      }

      // Main gallery images may arrive asynchronously or remount when a thumbnail is selected.
      // Observe the stable page root so each actual image gets one mask/cross-fade reveal.
      if (pathname.startsWith('/products/')) {
        let pendingImage: HTMLImageElement | null = null;
        const revealMainImage = (image: HTMLImageElement) => {
          if (!image.isConnected || image.dataset.ozGalleryRevealed === 'true') return;
          image.dataset.ozGalleryRevealed = 'true';
          if (!reduced) {
            gsap.fromTo(image, {
              opacity: 0.76,
              scale: 1.025,
              clipPath: 'inset(0 0 8% 0 round 10px)',
            }, {
              opacity: 1,
              scale: 1,
              clipPath: 'inset(0 0 0% 0 round 0px)',
              duration: 0.48,
              ease: 'power2.out',
              clearProps: 'transform,opacity,clipPath',
            });
          }
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 220);
        };
        const onMainImageLoad = () => {
          if (pendingImage) revealMainImage(pendingImage);
          pendingImage = null;
        };
        const checkMainImage = () => {
          const image = root.querySelector<HTMLImageElement>('[data-oz-product-main-image]');
          if (!image) return;
          if (pendingImage && pendingImage !== image) {
            pendingImage.removeEventListener('load', onMainImageLoad);
            pendingImage = null;
          }
          if (image.complete && image.naturalWidth > 0) {
            revealMainImage(image);
          } else if (!image.complete) {
            pendingImage = image;
            image.addEventListener('load', onMainImageLoad, { once: true });
          }
        };
        checkMainImage();
        const galleryObserver = new MutationObserver(checkMainImage);
        galleryObserver.observe(root, { childList: true, subtree: true });
        cleanups.push(() => {
          galleryObserver.disconnect();
          pendingImage?.removeEventListener('load', onMainImageLoad);
          pendingImage = null;
        });
      }
    }

    if (pathname.startsWith('/products/') && !reduced) {
      // Stagger the option controls without touching the sticky purchase panel or card roots.
      const labels = Array.from(root.querySelectorAll<HTMLElement>('h3, h4, label, p, span'))
        .filter((element) => /^(size|sizes|color|colors|المقاس|المقاسات|اللون|الألوان)$/iu.test((element.textContent || '').trim()));
      const controls = Array.from(new Set(labels.flatMap((label) => {
        const group = label.parentElement?.parentElement || label.parentElement;
        return group ? Array.from(group.querySelectorAll<HTMLElement>('button')) : [];
      }))).slice(0, 16);
      if (controls.length) tweens.push(gsap.fromTo(controls, { y: 8, scale: 0.985 }, {
        y: 0, scale: 1, duration: 0.3, stagger: 0.025, ease: 'power2.out', clearProps: 'transform', delay: 0.12,
      }));
      const price = root.querySelector<HTMLElement>('.text-2xl, .text-3xl');
      if (price) tweens.push(gsap.fromTo(price, { y: 7 }, {
        y: 0, duration: 0.36, ease: 'power2.out', clearProps: 'transform', delay: 0.08,
      }));
    }

    if (pathname === '/about' && !reduced && window.matchMedia('(min-width: 768px)').matches) {
      const storyImages = Array.from(root.querySelectorAll<HTMLElement>('img')).slice(0, 4);
      storyImages.forEach((image) => {
        const parallax = gsap.to(image, { y: 12, ease: 'none', paused: true });
        const trigger = ScrollTrigger.create({
          trigger: image,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
          animation: parallax,
        });
        tweens.push(parallax);
        triggers.push(trigger);
      });
    }

    if (pathname.startsWith('/order-success/') && !reduced) {
      const orderNumber = Array.from(root.querySelectorAll<HTMLElement>('*'))
        .find((element) => element.children.length === 0 && /^#?(OZ[-\s]?[A-Z0-9-]{5,}|[A-Z0-9-]{8,})$/iu.test((element.textContent || '').trim()));
      if (orderNumber) tweens.push(gsap.fromTo(orderNumber, { y: 8, scale: 0.98 }, {
        y: 0, scale: 1, duration: 0.42, ease: 'power3.out', clearProps: 'transform', delay: 0.32,
      }));
    }

    if (pathname === '/track' && !reduced) {
      let timelineObserver: MutationObserver | null = null;
      let timelineClassObserver: MutationObserver | null = null;
      let progressMedia: gsap.MatchMedia | null = null;
      let activeTimelineDot: HTMLElement | null = null;
      const pulseOriginals = new Set<HTMLElement>();
      const setupTimeline = () => {
        const timeline = root.querySelector<HTMLElement>('[data-oz-tracking-timeline]');
        if (!timeline) return;
        const steps = Array.from(timeline.querySelectorAll<HTMLElement>(':scope > div'));
        if (steps.length !== 4) return;
        const currentIndex = Math.max(0, steps.findIndex((step) =>
          step.className.includes('shadow-lg') || step.className.includes('shadow-md')
        ));
        const progress = Math.max(0, Math.min(100, (currentIndex / (steps.length - 1)) * 100));
        if (timeline.dataset.ozProgressReady) {
          const fill = timeline.querySelector<HTMLElement>('.oz-track-progress-fill');
          if (fill) {
            gsap.killTweensOf(fill);
            const isDesktop = window.matchMedia('(min-width: 640px)').matches;
            gsap.to(fill, isDesktop
              ? { width: progress + '%', duration: 0.42, ease: 'power2.out', overwrite: true }
              : { height: progress + '%', duration: 0.42, ease: 'power2.out', overwrite: true });
          }
          const nextDot = steps[currentIndex]?.querySelector<HTMLElement>('.rounded-full') || null;
          if (nextDot !== activeTimelineDot) {
            if (activeTimelineDot) {
              gsap.killTweensOf(activeTimelineDot);
              gsap.set(activeTimelineDot, { clearProps: 'transform' });
            }
            if (nextDot) {
              if (nextDot.classList.contains('animate-pulse')) {
                pulseOriginals.add(nextDot);
                nextDot.classList.remove('animate-pulse');
              }
              activeTimelineDot = nextDot;
              tweens.push(gsap.to(nextDot, { scale: 1.1, duration: 0.75, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: 'center center' }));
            }
          }
          timeline.dataset.ozCurrentStep = String(currentIndex);
          return;
        }
        timeline.dataset.ozProgressReady = 'true';
        const track = document.createElement('span');
        track.className = 'oz-track-progress-track';
        track.setAttribute('aria-hidden', 'true');
        const fill = document.createElement('span');
        fill.className = 'oz-track-progress-fill';
        track.append(fill);
        timeline.append(track);
        const currentStep = steps[currentIndex];
        const dot = currentStep?.querySelector<HTMLElement>('.rounded-full') || null;
        if (dot) {
          if (dot.classList.contains('animate-pulse')) {
            pulseOriginals.add(dot);
            dot.classList.remove('animate-pulse');
          }
          activeTimelineDot = dot;
          timeline.dataset.ozCurrentStep = String(currentIndex);
          tweens.push(gsap.to(dot, { scale: 1.1, duration: 0.75, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: 'center center' }));
        }
        progressMedia = gsap.matchMedia(timeline);
        progressMedia.add({
          desktop: '(min-width: 640px)',
          mobile: '(max-width: 639px)',
        }, (context) => {
          const animation = context.conditions?.desktop
            ? gsap.fromTo(fill, { width: '0%' }, { width: progress + '%', duration: 0.8, ease: 'power2.out' })
            : gsap.fromTo(fill, { height: '0%' }, { height: progress + '%', duration: 0.8, ease: 'power2.out' });
          tweens.push(animation);
          return () => animation.kill();
        });
        cleanups.push(() => {
          progressMedia?.revert();
          track.remove();
          delete timeline.dataset.ozProgressReady;
          pulseOriginals.forEach((originalDot) => originalDot.classList.add('animate-pulse'));
          pulseOriginals.clear();
          activeTimelineDot = null;
          delete timeline.dataset.ozCurrentStep;
        });
      };
      setupTimeline();
      timelineObserver = new MutationObserver(() => {
        setupTimeline();
        const timeline = root.querySelector<HTMLElement>('[data-oz-tracking-timeline]');
        if (timeline && !timelineClassObserver) {
          timelineClassObserver = new MutationObserver(() => setupTimeline());
          timelineClassObserver.observe(timeline, { attributes: true, subtree: true, attributeFilter: ['class'] });
        }
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 220);
      });
      timelineObserver.observe(root, { childList: true, subtree: true });
      const existingTimeline = root.querySelector<HTMLElement>('[data-oz-tracking-timeline]');
      if (existingTimeline) {
        timelineClassObserver = new MutationObserver(() => setupTimeline());
        timelineClassObserver.observe(existingTimeline, { attributes: true, subtree: true, attributeFilter: ['class'] });
      }
      cleanups.push(() => {
        timelineObserver?.disconnect();
        timelineClassObserver?.disconnect();
      });
    }

    // Small purchase feedback; handlers never prevent or delay the original action.
    const onPurchaseClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;
      const text = (button.textContent || '').toLowerCase();
      const labelText = (button.getAttribute('aria-label') || '').toLowerCase();
      if (!/(add to cart|add to bag|أضف|اضافة|إضافة|السلة)/u.test(text + ' ' + labelText)) return;
      if (!reduced) {
        gsap.fromTo(button, { scale: 0.975 }, { scale: 1, duration: 0.24, ease: 'back.out(2)', clearProps: 'transform' });
        const cartIcon = document.querySelector<HTMLElement>('header svg.lucide-shopping-bag')?.closest('button');
        if (cartIcon) gsap.fromTo(cartIcon, { scale: 1 }, { scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'transform' });
      }
    };
    root.addEventListener('click', onPurchaseClick);
    cleanups.push(() => root.removeEventListener('click', onPurchaseClick));

    // Animate drawer entrance when it mounts; no layers are added above its sticky/mobile controls.
    if (!reduced) {
      const animateDrawer = (node: Node) => {
        if (!(node instanceof HTMLElement)) return;
        const overlays = [node, ...Array.from(node.querySelectorAll<HTMLElement>('.fixed.inset-0.z-50'))]
          .filter((element) => element.matches('.fixed.inset-0.z-50'));
        overlays.forEach((overlay) => {
          if (!/shopping bag|your bag|سلة|شنطة|حقيبة|التسوق/iu.test(overlay.textContent || '')) return;
          const panel = overlay.querySelector<HTMLElement>('.max-w-md');
          if (panel) {
            gsap.fromTo(panel, { x: document.documentElement.dir === 'rtl' ? -34 : 34 }, {
              x: 0, duration: 0.4, ease: 'back.out(1.12)', clearProps: 'transform',
            });
            const rows = Array.from(panel.querySelectorAll<HTMLElement>('.rounded-xl')).filter((row) => row.querySelector('img')).slice(0, 8);
            if (rows.length) tweens.push(gsap.fromTo(rows, { y: 10 }, {
              y: 0, duration: 0.32, stagger: 0.045, ease: 'power2.out', clearProps: 'transform', delay: 0.06,
            }));
          }
        });
      };
      const drawerObserver = new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach(animateDrawer));
      });
      drawerObserver.observe(document.body, { childList: true, subtree: true });
      cleanups.push(() => drawerObserver.disconnect());
    }

    // Header: hide while scrolling down, restore while scrolling up. No second scroll engine is created.
    const header = document.querySelector<HTMLElement>('header');
    if (header && !reduced) {
      let previousY = window.scrollY;
      let hidden = false;
      const onScrollDirection = () => {
        const currentY = window.scrollY;
        const delta = currentY - previousY;
        previousY = currentY;
        if (header.querySelector('[aria-expanded="true"]')) return;
        if (currentY < 72 || delta < -8) {
          if (hidden) {
            hidden = false;
            gsap.to(header, { yPercent: 0, duration: 0.24, ease: 'power2.out', overwrite: true });
          }
        } else if (delta > 8 && currentY > 120 && !hidden) {
          hidden = true;
          gsap.to(header, { yPercent: -110, duration: 0.24, ease: 'power2.out', overwrite: true });
        }
      };
      window.addEventListener('scroll', onScrollDirection, { passive: true });
      cleanups.push(() => {
        window.removeEventListener('scroll', onScrollDirection);
        gsap.killTweensOf(header);
        gsap.set(header, { clearProps: 'transform' });
      });
    }

    // Mobile bottom navigation indicator follows the active item in either text direction.
    const mobileNav = document.querySelector<HTMLElement>('[data-oz-mobile-nav]');
    if (mobileNav && !reduced && mobileNav.classList.contains('md:hidden')) {
      const navInner = mobileNav.firstElementChild as HTMLElement | null;
      const activeItem = () => Array.from(mobileNav.querySelectorAll<HTMLElement>('button'))
        .find((button) => button.className.includes('font-bold'));
      if (navInner) {
        const indicator = document.createElement('span');
        indicator.className = 'oz-mobile-nav-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        navInner.append(indicator);
        const oldPosition = navInner.style.position;
        navInner.style.position = 'relative';
        const moveIndicator = () => {
          const active = activeItem();
          if (!active) return;
          const parentRect = navInner.getBoundingClientRect();
          const rect = active.getBoundingClientRect();
          gsap.to(indicator, {
            x: document.documentElement.dir === 'rtl' ? rect.right - parentRect.right : rect.left - parentRect.left,
            width: rect.width,
            duration: 0.3,
            ease: 'power3.out',
            overwrite: true,
          });
        };
        moveIndicator();
        window.addEventListener('resize', moveIndicator);
        cleanups.push(() => {
          window.removeEventListener('resize', moveIndicator);
          indicator.remove();
          navInner.style.position = oldPosition;
          gsap.killTweensOf(indicator);
        });
      }
    }

    // Desktop header navigation underline follows the active route in both RTL and LTR.
    const desktopNav = document.querySelector<HTMLElement>('[data-oz-header-nav]');
    if (desktopNav && !reduced) {
      const activeItem = () => Array.from(desktopNav.querySelectorAll<HTMLElement>('button'))
        .find((button) => button.className.includes('font-bold'));
      const indicator = document.createElement('span');
      indicator.className = 'oz-header-nav-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      desktopNav.append(indicator);
      const oldPosition = desktopNav.style.position;
      desktopNav.style.position = 'relative';
      const moveIndicator = () => {
        const active = activeItem();
        if (!active) return;
        const parentRect = desktopNav.getBoundingClientRect();
        const rect = active.getBoundingClientRect();
        gsap.to(indicator, {
          x: document.documentElement.dir === 'rtl' ? rect.right - parentRect.right : rect.left - parentRect.left,
          width: rect.width,
          duration: 0.32,
          ease: 'power3.out',
          overwrite: true,
        });
      };
      moveIndicator();
      window.addEventListener('resize', moveIndicator);
      cleanups.push(() => {
        window.removeEventListener('resize', moveIndicator);
        indicator.remove();
        desktopNav.style.position = oldPosition;
        gsap.killTweensOf(indicator);
      });
    }

    // Footer columns enter gently as they approach the viewport; cap the animated elements.
    const footer = document.querySelector<HTMLElement>('footer');
    if (footer && !reduced) {
      const columns = Array.from(footer.querySelectorAll<HTMLElement>('.grid > div')).slice(0, 4);
      columns.forEach((column) => {
        const tween = gsap.fromTo(column, { y: 12 }, {
          y: 0,
          duration: 0.48,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: column, start: 'top 92%', once: true },
        });
        tweens.push(tween);
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger as ScrollTrigger);
      });
    }

    // Order confirmation: draw the existing check icon and emit a small one-time particle burst.
    if (pathname.startsWith('/order-success/') && !reduced) {
      const checkHost = root.querySelector<HTMLElement>('[class*="bg-emerald-500/10"]');
      const svg = checkHost?.querySelector<SVGSVGElement>('svg');
      const paths = svg ? Array.from(svg.querySelectorAll<SVGGeometryElement>('path, polyline, line, circle')) : [];
      paths.forEach((path) => {
        try {
          const length = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;
          if (length > 0) {
            gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
            tweens.push(gsap.to(path, { strokeDashoffset: 0, duration: 0.72, ease: 'power2.out', delay: 0.12 }));
          }
        } catch { /* Some SVG primitives do not expose a measurable path length. */ }
      });
      if (checkHost) {
        const previousPosition = checkHost.style.position;
        checkHost.style.position = 'relative';
        const particles = Array.from({ length: 8 }, (_, index) => {
          const particle = document.createElement('span');
          particle.className = 'oz-success-particle';
          particle.setAttribute('aria-hidden', 'true');
          checkHost.append(particle);
          const angle = (Math.PI * 2 * index) / 8;
          tweens.push(gsap.fromTo(particle, { x: 0, y: 0, scale: 0.25, opacity: 0.9 }, {
            x: Math.cos(angle) * 42,
            y: Math.sin(angle) * 42,
            scale: 1,
            opacity: 0,
            duration: 0.68,
            delay: 0.18,
            ease: 'power2.out',
          }));
          return particle;
        });
        cleanups.push(() => {
          particles.forEach((particle) => particle.remove());
          checkHost.style.position = previousPosition;
        });
      }
    }

    // Validation messages enter without intercepting form submission or input events.
    if ((pathname === '/checkout' || pathname === '/contact') && !reduced) {
      const animateErrors = (node: Node) => {
        if (!(node instanceof HTMLElement)) return;
        const candidates = [
          ...(node.matches('[role="alert"], .text-red-200, .text-rose-400, .text-red-500') ? [node] : []),
          ...Array.from(node.querySelectorAll<HTMLElement>('[role="alert"], .text-red-200, .text-rose-400, .text-red-500')),
        ];
        candidates.slice(0, 8).forEach((element) => {
          if (element.dataset.ozErrorAnimated) return;
          element.dataset.ozErrorAnimated = 'true';
          gsap.fromTo(element, { y: 8 }, { y: 0, duration: 0.22, ease: 'power2.out', clearProps: 'transform' });
        });
      };
      const formObserver = new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach(animateErrors));
      });
      formObserver.observe(root, { childList: true, subtree: true });
      cleanups.push(() => formObserver.disconnect());
    }

    // Cart controls: animate quantity feedback and row removal without delaying state changes.
    const onCartAction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button || reduced) return;
      const row = button.closest<HTMLElement>('.rounded-xl');
      if (button.querySelector('svg.lucide-trash-2')) {
        // Cart page and drawer own their row-collapse sequence to avoid competing tweens.
        if (row?.hasAttribute('data-oz-cart-row')) return;
        if (row) gsap.to(row, { y: -5, scale: 0.985, opacity: 0, duration: 0.16, ease: 'power2.in' });
        return;
      }
      const actionLabel = `${button.getAttribute('aria-label') || ''} ${button.textContent || ''}`.toLowerCase().trim();
      if (
        button.querySelector('svg.lucide-plus, svg.lucide-minus') ||
        /increase|decrease|quantity|زيادة|تقليل|الكمية/u.test(actionLabel) ||
        actionLabel === '+' || actionLabel === '-'
      ) {
        const row = button.closest<HTMLElement>('[data-oz-cart-row]');
        const group = button.parentElement;
        const quantity = row?.querySelector<HTMLElement>('[data-oz-quantity]') ||
          (group && Array.from(group.querySelectorAll<HTMLElement>('span, div'))
            .find((element) => element.children.length === 0 && /^\d+$/u.test((element.textContent || '').trim())));
        if (quantity) gsap.fromTo(quantity, { y: 4, scale: 0.82 }, {
          y: 0, scale: 1, duration: 0.22, ease: 'back.out(2)', clearProps: 'transform',
        });
      }
    };
    document.addEventListener('click', onCartAction);
    cleanups.push(() => document.removeEventListener('click', onCartAction));

    const refreshAfterContent = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 260);
    };
    const observedImages = Array.from(root.querySelectorAll('img'));
    observedImages.forEach((image) => {
      if (!image.complete) image.addEventListener('load', refreshAfterContent, { once: true });
    });
    cleanups.push(() => {
      window.clearTimeout(refreshTimer);
      observedImages.forEach((image) => image.removeEventListener('load', refreshAfterContent));
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      tweens.forEach((tween) => tween.kill());
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [pathname]);
}
