import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "dark" | "light";
interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
}
const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return (localStorage.getItem("idea.theme") as Mode) || "light";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
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
