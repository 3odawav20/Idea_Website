import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/i18n";
import "./HeroCarousel.css";
import "./HeroBrandFilm.css";

const SOURCES = {
  desktop: "/media/hero/idea-brand-v1-1080.mp4",
  mobile: "/media/hero/idea-brand-v1-720.mp4",
  poster: "/media/hero/idea-brand-v1-poster.jpg",
};

/**
 * First-party autoplaying brand film. Hidden player UI and silent soundtrack.
 * Source MP4s are hosted directly on IDEA cPanel.
 */
export function HeroBrandFilm() {
  const { locale } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    video.muted = true;
    video.defaultMuted = true;

    const resume = () => {
      if (reduce.matches || document.hidden) {
        video.pause();
        return;
      }
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        void promise.catch(() => setPlaying(false));
      }
    };
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else resume();
    };
    const onMotion = () => {
      if (reduce.matches) video.pause();
      else resume();
    };
    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) resume();
        else video.pause();
      }, { threshold: 0.08 });
      observer.observe(hero);
    } else {
      resume();
    }
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener?.("change", onMotion);
    resume();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener?.("change", onMotion);
      video.pause();
    };
  }, []);

  const ariaLabel = locale === "ar"
    ? "فيلم IDEA الرسمي لخامات السيراميك والبورسلين والرخام"
    : locale === "fr"
      ? "Film officiel IDEA des surfaces en céramique, grès cérame et marbre"
      : "IDEA official ceramic, porcelain and marble brand film";

  return (
    <section ref={heroRef} className="idea-editorial-hero idea-film-ready" aria-label={ariaLabel}>
      <div className={"idea-film-shell" + (playing ? " idea-film-is-playing" : "")} data-idea-brand-film="v1">
        <img className="idea-film-poster" src={SOURCES.poster} alt="" fetchPriority="high" decoding="async" />
        <video
          ref={videoRef}
          className="idea-film-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={SOURCES.poster}
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        >
          <source media="(max-width: 767px)" src={SOURCES.mobile} type="video/mp4" />
          <source src={SOURCES.desktop} type="video/mp4" />
        </video>
        <div className="idea-film-vignette" aria-hidden="true" />
        <div className="idea-film-scroll-mark" aria-hidden="true" />
      </div>
    </section>
  );
}
