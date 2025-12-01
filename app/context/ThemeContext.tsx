"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // 1. Check localStorage
        const saved = localStorage.getItem("theme") as Theme | null;
        // 2. Check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        const initial = saved || (prefersDark ? "dark" : "light");
        setThemeState(initial);
        applyTheme(initial);
        setMounted(true);
    }, []);

    const applyTheme = (t: Theme) => {
        const root = document.documentElement;

        // Set data attribute for CSS selectors
        root.setAttribute("data-theme", t);

        // Set class for Tailwind dark mode
        if (t === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        // Set CSS Variables for global usage
        // Set CSS Variables for global usage
        if (t === "light") {
            // Modern Light Theme (Clean & Crisp)
            root.style.setProperty("--bg", "#f3f4f6");          // Light Gray Background (Tailwind Gray-100)
            root.style.setProperty("--panel", "rgba(255, 255, 255, 0.95)");
            root.style.setProperty("--muted", "#64748b");       // Slate-500
            root.style.setProperty("--text", "#0f172a");        // Slate-900 (High Contrast)
            root.style.setProperty("--accent", "#6366f1");      // Indigo-500 (Vibrant but readable)
            root.style.setProperty("--accent-glow", "rgba(99, 102, 241, 0.2)");
            root.style.setProperty("--primary", "#10b981");     // Emerald-500
            root.style.setProperty("--danger", "#ef4444");      // Red-500
            root.style.setProperty("--card-bg", "#ffffff");     // Pure White Cards
            root.style.setProperty("--surface", "#ffffff");     // White Surface
            root.style.setProperty("--border", "#e2e8f0");      // Slate-200 (Subtle Border)
            root.style.setProperty("--glass", "rgba(255, 255, 255, 0.8)");
            root.style.setProperty("--glass-border", "rgba(0, 0, 0, 0.06)");
            root.style.setProperty("--nav-hover", "#f1f5f9");   // Slate-100
            root.style.setProperty("--popover", "#ffffff");
        } else {
            // Modern Dark Theme (Deep & Rich)
            root.style.setProperty("--bg", "#0f172a");          // Slate-900
            root.style.setProperty("--panel", "rgba(30, 41, 59, 0.8)");
            root.style.setProperty("--muted", "#94a3b8");       // Slate-400
            root.style.setProperty("--text", "#f8fafc");        // Slate-50
            root.style.setProperty("--accent", "#818cf8");      // Indigo-400
            root.style.setProperty("--accent-glow", "rgba(129, 140, 248, 0.25)");
            root.style.setProperty("--primary", "#34d399");     // Emerald-400
            root.style.setProperty("--danger", "#f87171");      // Red-400
            root.style.setProperty("--card-bg", "rgba(30, 41, 59, 0.5)"); // Semi-transparent Slate-800
            root.style.setProperty("--surface", "#1e293b");     // Slate-800
            root.style.setProperty("--border", "rgba(255, 255, 255, 0.1)");
            root.style.setProperty("--glass", "rgba(15, 23, 42, 0.7)");
            root.style.setProperty("--glass-border", "rgba(255, 255, 255, 0.1)");
            root.style.setProperty("--nav-hover", "rgba(255, 255, 255, 0.05)");
            root.style.setProperty("--popover", "#1e293b");
        }
    };

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setThemeState(next);
        localStorage.setItem("theme", next);
        applyTheme(next);
    };

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem("theme", t);
        applyTheme(t);
    };

    // Prevent hydration mismatch by rendering nothing until mounted
    // if (!mounted) {
    //     return <>{children}</>;
    // }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {/* Avoid hydration mismatch by only rendering children when mounted, or accept mismatch. 
                For now, we render always to ensure context availability. 
                To fix hydration mismatch properly, we suppress warning or use a specific strategy.
            */}
            <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
