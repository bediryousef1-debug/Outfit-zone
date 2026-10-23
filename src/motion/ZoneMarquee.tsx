import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './cinematic-home.css';

const MARQUEE_TEXT = 'NEW DROP × WEAR IN THE ZONE × OUTFIT ZONE ×';

export function ZoneMarquee() {
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    if (!band || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const tracks = Array.from(
        band.querySelectorAll<HTMLElement>('.oz-marquee-track')
      );
      if (!tracks.length) return;

      const tweens = tracks.map((track, index) =>
        gsap.fromTo(
          track,
          { xPercent: 0 },
          {
            xPercent: index === 0 ? -50 : 50,
            duration: index === 0 ? 28 : 34,
            ease: 'none',
            repeat: -1,
            paused: true,
          }
        )
      );

      const timeScaleSetters = tweens.map((tween) =>
        gsap.quickTo(tween, 'timeScale', { duration: 0.28, ease: 'power2.out' })
      );

      const scrollTrigger = ScrollTrigger.create({
        trigger: band,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          tweens.forEach((tween) => {
            if (self.isActive) tween.play();
            else tween.pause();
          });
        },
        onUpdate: (self) => {
          const velocity = Math.abs(self.getVelocity());
          const timeScale = gsap.utils.clamp(0.7, 2.35, 1 + velocity / 1800);
          timeScaleSetters.forEach((setTimeScale) => setTimeScale(timeScale));
        },
      });

      return () => {
        scrollTrigger.kill();
        tweens.forEach((tween) => {
          gsap.killTweensOf(tween);
          tween.kill();
        });
        timeScaleSetters.forEach((setTimeScale) => setTimeScale.tween.kill());
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
