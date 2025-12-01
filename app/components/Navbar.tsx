"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.ok) setUser(await res.json());
    } catch { setUser(null); }
    finally { setLoading(false); }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } catch (e) { console.error(e); }
  }

  if (!mounted) return null;

  const navLinks = [
    { href: "/generator", label: "🔍 Single Generator" },
    { href: "/batch-search", label: "📦 Batch Search" },
    { href: "/dashboard", label: "📊 Dashboard" },
    { href: "/saved-global", label: "🌐 Saved Parts" },
    { href: "/integration", label: "🧩 BookMarkURL" },
  ];

  return (
    <>
      <style jsx global>{`
        :root {
          --nav-height: 70px;
        }
        
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--nav-height);
          background: var(--glass);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--glass-border);
          z-index: 1000;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          padding: 0 24px;
        }
        .navbar.scrolled {
          background: var(--panel);
          box-shadow: 0 4px 30px rgba(0,0,0,0.1);
        }

        .nav-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          font-size: 22px;
          font-weight: 800;
          background: linear-gradient(135deg, var(--accent) 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.5px;
        }

        .nav-links {
          display: flex;
          gap: 6px;
          align-items: center;
          background: var(--surface);
          padding: 4px;
          border-radius: 16px;
          border: 1px solid var(--border);
        }
        
        .nav-link {
          padding: 8px 16px;
          border-radius: 12px;
          color: var(--muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .nav-link:hover {
          color: var(--text);
          background: var(--nav-hover);
        }
        
        .nav-link.active {
          background: var(--bg);
          color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .action-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Theme Toggle Button */
        .theme-toggle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .theme-toggle:hover {
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--text);
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
        }

        .user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 6px 8px 6px 16px;
          border-radius: 24px;
          cursor: pointer;
          color: var(--text);
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        .user-btn:hover { 
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }
        
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #ec4899);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          border: 2px solid var(--bg);
        }

        .dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 240px;
          background: var(--panel);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 8px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: top right;
        }
        
        .dropdown-item {
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .dropdown-item:hover { 
          background: var(--surface); 
          color: var(--accent); 
          transform: translateX(4px);
        }
        
        .dropdown-divider { 
          height: 1px; 
          background: var(--border); 
          margin: 4px 8px; 
        }

        @keyframes slideDown {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Mobile Menu */
        .mobile-menu {
          position: fixed;
          top: var(--nav-height);
          left: 0;
          right: 0;
          background: var(--panel);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 900px) {
          .nav-links { display: none; }
          .mobile-toggle { display: block; }
          .user-section { display: none; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="brand" style={{ background: 'none', WebkitTextFillColor: 'initial' }}>
            <img
              src={theme === "dark" ? "/images/lumentum-light.png" : "/images/lumentum-dark.png"}
              alt="Lumentum"
              style={{ height: "32px", width: "auto", objectFit: "contain" }}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="nav-links">
            {user && navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="action-group">
            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === "dark" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            {/* User Menu (Desktop) */}
            {user ? (
              <div className="user-section" style={{ position: "relative" }}>
                <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <span>{user.name}</span>
                  <div className="avatar">
                    {user.avatar ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : user.name?.charAt(0)}
                  </div>
                </button>

                {dropdownOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setDropdownOpen(false)} />
                    <div className="dropdown" style={{ zIndex: 999 }}>
                      <div style={{ padding: "8px 16px", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>ACCOUNT</div>
                      <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <span>👤</span> Profile
                      </Link>
                      {(user.role === "ADMIN" || user.role === "OWNER") && (
                        <Link href="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <span>🔧</span> Admin Panel
                        </Link>
                      )}
                      <div className="dropdown-divider" />
                      <button onClick={handleLogout} className="dropdown-item" style={{ color: "var(--danger)" }}>
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="user-btn" style={{ background: "var(--accent)", color: "white", border: "none" }}>
                Login
              </Link>
            )}

            {/* Mobile Toggle */}
            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, top: "70px", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)", zIndex: 998 }} onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu">
            {user && navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: "100%", justifyContent: "flex-start", padding: "12px 16px" }}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="dropdown-divider" />
                <Link href="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>👤 Profile</Link>
                <button onClick={handleLogout} className="nav-link" style={{ color: "var(--danger)", textAlign: "left", width: "100%" }}>🚪 Logout</button>
              </>
            ) : (
              <Link href="/login" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>🔐 Login</Link>
            )}
          </div>
        </>
      )}

      {/* Spacer to prevent content overlap */}
      <div style={{ height: "var(--nav-height)" }} />
    </>
  );
}
