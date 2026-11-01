import { useCallback, useState } from "react";
import { Sidebar } from "../components/Sidebar.tsx";
import { DashboardPage } from "../features/dashboard/DashboardPage.tsx";
import { MovementsPage } from "../features/movements/MovementsPage.tsx";
import { ProductsPage } from "../features/products/ProductsPage.tsx";
import { NAV_ITEMS, type AppView } from "../lib/navigation.ts";

export function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const currentLabel = NAV_ITEMS.find((item) => item.id === view)?.label ?? "StockWise";

  const navigate = useCallback((next: AppView) => {
    setView(next);
    setNavOpen(false);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <Sidebar current={view} open={navOpen} onNavigate={navigate} onClose={() => setNavOpen(false)} />
      <div className="min-w-0 lg:ps-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            aria-controls="mobile-nav"
            onClick={() => setNavOpen(true)}
          >
            <MenuIcon />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">StockWise</p>
            <p className="truncate text-xs text-slate-500">{currentLabel}</p>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {view === "dashboard" ? <DashboardPage onOpenProducts={() => navigate("products")} /> : null}
          {view === "products" ? <ProductsPage /> : null}
          {view === "movements" ? <MovementsPage onOpenProducts={() => navigate("products")} /> : null}
        </main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
