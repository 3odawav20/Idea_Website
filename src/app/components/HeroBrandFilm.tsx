import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/i18n";
import { useTheme } from "../theme/theme";
import "./HeroBrandFilm.css";

const SOURCES = {
  desktop: "/media/hero/idea-owner-20261112.mp4",
  mobile: "/media/hero/idea-owner-20261112-mobile.mp4",
  poster: "/media/hero/idea-light-porcelain.webp",
  images: ["/media/hero/idea-light-porcelain.webp", "/media/hero/idea-light-marble.webp"],
};

// Owner-supplied film shared by both themes; stills follow the selected theme.
export function HeroBrandFilm() {
  const { locale } = useI18n();
  const { mode } = useTheme();
  const sources = mode === "dark" ? {
    desktop: "/media/hero/idea-owner-20261112.mp4",
    mobile: "/media/hero/idea-owner-20261112-mobile.mp4",
    poster: "/media/hero/idea-dark-porcelain.webp",
    images: ["/media/hero/idea-dark-porcelain.webp", "/media/hero/idea-dark-marble.webp"],
  } : SOURCES;
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const captions = locale === "ar" ? [
    ["مساحتك تبدأ", "بفكرة."], ["أناقة البورسلين.", "تفاصيل تصنع الفرق."], ["جمال الرخام.", "حضور لا يتكرر."],
  ] : locale === "fr" ? [
    ["Votre espace commence", "par une idée."], ["L’élégance du grès.", "Le sens du détail."], ["La beauté du marbre.", "Un caractère unique."],
  ] : [
    ["Beautiful surfaces.", "Extraordinary spaces."], ["Porcelain, perfected.", "Beauty in every detail."], ["Marble, naturally.", "Character beyond compare."],
  ];

  useEffect(() => { setActiveSlide(0); }, [mode]);
  useEffect(() => {
    if (activeSlide === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActiveSlide(slide => (slide + 1) % 3), 7000);
    return () => window.clearTimeout(timer);
  }, [activeSlide, mode]);

  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(false);
    video.muted = true;
    video.defaultMuted = true;
    if (activeSlide === 0) video.currentTime = 0;

    // Do not treat a transient play() abort while media is loading as a broken film.
    // Wait for the first decoded frame before attempting to start playback.
    let playPending = false;
    const resume = () => {
      if (activeSlide !== 0 || reduce.matches || document.hidden) {
        video.pause();
        if (reduce.matches) setActiveSlide(1);
        return;
      }
      if (!video.paused || playPending || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      playPending = true;
      const promise = video.play();
      if (promise && typeof promise.then === "function") {
        void promise.then(
          () => { playPending = false; },
          (reason: unknown) => {
            playPending = false;
            setPlaying(false);
            // AbortError is expected during source/visibility changes, not a
            // reason to permanently replace the owner's video with a still.
            if (reason instanceof DOMException && reason.name === "AbortError") return;
            // Only an actual media error advances to the image fallback.
            if (video.error) setActiveSlide(1);
          },
        );
      } else {
        playPending = false;
      }
    };
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else resume();
    };
    const onMotion = () => {
      if (reduce.matches) { video.pause(); setActiveSlide(1); }
      else setActiveSlide(0);
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
    video.addEventListener("loadeddata", resume);
    video.addEventListener("canplay", resume);
    resume();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener?.("change", onMotion);
      video.removeEventListener("loadeddata", resume);
      video.removeEventListener("canplay", resume);
      video.pause();
    };
  }, [mode, activeSlide]);

  // Each word gets its own entrance, while the h1 stays one readable phrase for assistive technology.
  const animatedWords = (line: string, startIndex: number) =>
    line.trim().split(/\s+/u).map((word, index) => (
      <span
        key={`${startIndex}-${index}`}
        className="idea-film-word"
        style={{ animationDelay: `${0.12 + (startIndex + index) * 0.145}s` }}
      >
        {word}
      </span>
    ));

  const ariaLabel = locale === "ar"
    ? "فيلم IDEA الرسمي لخامات السيراميك والبورسلين والرخام"
    : locale === "fr"
      ? "Film officiel IDEA des surfaces en céramique, grès cérame et marbre"
      : "IDEA official ceramic, porcelain and marble brand film";

  return (
    <section ref={heroRef} className="idea-editorial-hero idea-film-ready" aria-label={ariaLabel}>
      <div className={"idea-film-shell" + (playing && activeSlide === 0 ? " idea-film-is-playing" : "")} data-idea-brand-film={mode} data-active-slide={activeSlide}>
        {sources.poster && activeSlide === 0 && <img className="idea-film-poster" src={sources.poster} alt="" fetchPriority="high" decoding="async" />}
        {sources.images.map((src, index) => <img key={src} className={`idea-film-still${activeSlide === index + 1 ? " is-active" : ""}`} src={src} alt="" decoding="async" aria-hidden="true" />)}
        <video
          key={mode}
          ref={videoRef}
          className="idea-film-video"
          autoPlay
          muted
          loop={false}
          playsInline
          preload="auto"
          poster={sources.poster}
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => { setPlaying(false); setActiveSlide(1); }}
          onEnded={() => setActiveSlide(1)}
        >
          <source media="(max-width: 767px)" src={sources.mobile} type="video/mp4" />
          <source src={sources.desktop} type="video/mp4" />
        </video>
        <div className="idea-film-caption-scrim" aria-hidden="true" />
        <div key={`${mode}-${activeSlide}-${locale}`} className="idea-film-caption" dir={locale === "ar" ? "rtl" : "ltr"}>
          <p className="idea-film-eyebrow">{locale === "ar" ? "إيديا" : "IDEA"}</p>
          <h1 aria-label={`${captions[activeSlide][0]} ${captions[activeSlide][1]}`}>
            <span className="idea-film-line idea-film-line--white" aria-hidden="true">
              {animatedWords(captions[activeSlide][0], 0)}
            </span>
            <span className="idea-film-line idea-film-line--orange" aria-hidden="true">
              {animatedWords(captions[activeSlide][1], captions[activeSlide][0].trim().split(/\s+/u).length)}
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}
