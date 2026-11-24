import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

type Mode = "dark" | "light";
interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
}
const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      const saved = localStorage.getItem("idea.theme");
      return saved === "dark" || saved === "light" ? saved : "light";
    } catch {
      return "dark";
    }
  });

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem("idea.theme", mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  return (
    <Ctx.Provider value={{ mode, toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
