import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
  text.match(/\\s+|[^\\s]+/gu)?.forEach((token) => {
    if (/^\\s+$/u.test(token)) {
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
  heading.setAttribute('aria-label', text.replace(/\\s+/gu, ' ').trim());
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
    const root = document.querySelector<HTMLElement>('.oz-page-motion.oz-route-motion-root');
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const label = pageKey(pathname);
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

    if (!reduced) {
      // Mark existing editorial sections without replacing their markup or changing their layout.
      const scenes = Array.from(root.querySelectorAll<HTMLElement>('section, [data-oz-scroll-scene]'));
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
      const animateProductImages = () => {
        const grid = root.querySelector<HTMLElement>('[class*="grid-cols-2"][class*="sm:grid-cols-3"]');
        if (!grid) return;
        const images = Array.from(grid.querySelectorAll<HTMLElement>('img')).slice(0, 16);
        if (!images.length) return;
        gsap.killTweensOf(images);
        tweens.push(gsap.fromTo(images, { y: 10, scale: 0.985 }, {
          y: 0, scale: 1, duration: 0.36, stagger: 0.025, ease: 'power2.out', clearProps: 'transform',
        }));
      };
      if (pathname === '/products') {
        let mutationTimer = 0;
        const gridObserver = new MutationObserver(() => {
          window.clearTimeout(mutationTimer);
          mutationTimer = window.setTimeout(animateProductImages, 90);
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 220);
        });
        gridObserver.observe(root, { childList: true, subtree: true });
        cleanups.push(() => {
          window.clearTimeout(mutationTimer);
          gridObserver.disconnect();
        });
      }

      // Main product image reacts to thumbnail selection without touching the sticky purchase panel.
      if (pathname.startsWith('/products/')) {
        const onThumbnailClick = (event: Event) => {
          const target = event.target as HTMLElement | null;
          const button = target?.closest('button');
          if (!button || !button.querySelector('img')) return;
          const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
          const mainImage = images.filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.width > 180 && rect.height > 180;
          }).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
          if (mainImage) {
            gsap.fromTo(mainImage, { scale: 1.018, y: 3 }, {
              scale: 1, y: 0, duration: 0.32, ease: 'power2.out', clearProps: 'transform',
            });
          }
        };
        root.addEventListener('click', onThumbnailClick);
        cleanups.push(() => root.removeEventListener('click', onThumbnailClick));
      }
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
          if (!/shopping bag|your bag|سلة|شنطة/iu.test(overlay.textContent || '')) return;
          const panel = overlay.querySelector<HTMLElement>('.max-w-md');
          if (panel) gsap.fromTo(panel, { x: document.documentElement.dir === 'rtl' ? -34 : 34 }, {
            x: 0, duration: 0.38, ease: 'power3.out', clearProps: 'transform',
          });
        });
      };
      const drawerObserver = new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach(animateDrawer));
      });
      drawerObserver.observe(document.body, { childList: true, subtree: true });
      cleanups.push(() => drawerObserver.disconnect());
    }

    const refreshAfterContent = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 260);
    };
    root.querySelectorAll('img').forEach((image) => {
      if (!image.complete) image.addEventListener('load', refreshAfterContent, { once: true });
    });
    cleanups.push(() => {
      window.clearTimeout(refreshTimer);
      root.querySelectorAll('img').forEach((image) => image.removeEventListener('load', refreshAfterContent));
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      tweens.forEach((tween) => tween.kill());
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [pathname]);
}
