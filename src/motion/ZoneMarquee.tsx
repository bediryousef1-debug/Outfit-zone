import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './cinematic-home.css';

const MARQUEE_TEXT = 'NEW DROP × WEAR IN THE ZONE × OUTFIT ZONE ×';

export function ZoneMarquee() {
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    const tracks = band?.querySelectorAll<HTMLElement>('.oz-marquee-track');
    if (!band || !tracks?.length) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(band);

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const track = tracks[0];
      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 19,
        ease: 'none',
        repeat: -1,
        paused: true,
      });
      const easeSpeed = gsap.quickTo(tween, 'timeScale', {
        duration: 0.32,
        ease: 'power2.out',
      });
      const trigger = ScrollTrigger.create({
        trigger: band,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (self.isActive) tween.play();
          else {
            easeSpeed(1);
            tween.pause();
          }
        },
        onUpdate: (self) => {
          easeSpeed(gsap.utils.clamp(0.65, 2.15, 1 + Math.abs(self.getVelocity()) / 1800));
        },
      });

      if (trigger.isActive) tween.play();

      return () => {
        trigger.kill();
        gsap.killTweensOf(tween);
        tween.kill();
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
