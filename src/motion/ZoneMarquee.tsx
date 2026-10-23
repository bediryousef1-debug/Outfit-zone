import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(band);

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const tweens = tracks.map((track, index) =>
        gsap.to(track, {
          xPercent: index === 0 ? -50 : 50,
          duration: index === 0 ? 19 : 23,
          ease: 'none',
          repeat: -1,
          paused: true,
        })
      );
      const speedSetters = tweens.map((tween) =>
        gsap.quickTo(tween, 'timeScale', {
          duration: 0.32,
          ease: 'power2.out',
        })
      );

      const trigger = ScrollTrigger.create({
        trigger: band,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (self.isActive) {
            tweens.forEach((tween) => tween.play());
          } else {
            speedSetters.forEach((setSpeed) => setSpeed(1));
            tweens.forEach((tween) => tween.pause());
          }
        },
        onUpdate: (self) => {
          const timeScale = gsap.utils.clamp(
            0.65,
            2.15,
            1 + Math.abs(self.getVelocity()) / 1800
          );
          speedSetters.forEach((setSpeed) => setSpeed(timeScale));
        },
      });

      if (trigger.isActive) tweens.forEach((tween) => tween.play());

      return () => {
        trigger.kill();
        speedSetters.forEach((setSpeed) => setSpeed.tween.kill());
        tweens.forEach((tween) => {
          gsap.killTweensOf(tween);
          tween.kill();
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
