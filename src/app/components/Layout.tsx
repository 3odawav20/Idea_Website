import { useEffect } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";
import { motion, useScroll, useSpring, useReducedMotion, AnimatePresence } from "motion/react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    // Do not override the browser's own restored scroll position when the user
    // returns with Back/Forward (especially important on Safari for iPhone).
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [pathname, navigationType, reduce]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--idea-bg)" }}>
      {/* Reading progress — thin gold sweep pinned to the very top */}
      <motion.div
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 100, transformOrigin: "0% 50%",
          background: "linear-gradient(90deg, var(--idea-gold-deep), var(--idea-gold-bright))",
          scaleX: reduce ? 1 : progress, opacity: reduce ? 0 : 1,
        }}
      />
      <Header />
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
