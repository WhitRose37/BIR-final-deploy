"use client";

import React from "react";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./context/ThemeContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <Navbar />
            {children}
        </ThemeProvider>
    );
}
