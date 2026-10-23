import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './cinematic-home.css';

const MARQUEE_TEXT = 'NEW DROP × WEAR IN THE ZONE × OUTFIT ZONE ×';

export function ZoneMarquee() {
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;

    const tracks = Array.from(
      band.querySelectorAll<HTMLElement>('.oz-marquee-track')
    );
    if (!tracks.length) return;

    // Run the ribbons continuously instead of depending on ScrollTrigger enter/leave
    // events, which can be missed when the page restores its previous scroll position.
    const media = gsap.matchMedia(band);
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const tweens = tracks.map((track, index) =>
        gsap.to(track, {
          xPercent: index === 0 ? -50 : 50,
          duration: index === 0 ? 19 : 23,
          ease: 'none',
          repeat: -1,
          paused: false,
        })
      );

      return () => {
        tweens.forEach((tween) => {
          tween.kill();
          gsap.set(tween.targets(), { clearProps: 'transform' });
        });
      };
    });

    return () => media.revert();
  }, []);

  return (
    <div className="oz-marquee-band" ref={bandRef} aria-hidden="true">
      <div className="oz-marquee-ribbon oz-marquee-ribbon-primary">
        <div className="oz-marquee-track">
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
        </div>
      </div>
      <div className="oz-marquee-ribbon oz-marquee-ribbon-secondary">
        <div className="oz-marquee-track">
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
        </div>
      </div>
    </div>
  );
}
