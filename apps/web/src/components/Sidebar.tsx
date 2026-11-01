import { useEffect, useRef, type ReactNode } from "react";
import { NAV_ITEMS, type AppView } from "../lib/navigation.ts";

export function Sidebar({
  current,
  open,
  onNavigate,
  onClose,
}: {
  current: AppView;
  open: boolean;
  onNavigate: (view: AppView) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    function onChange() {
      if (media.matches) {
        onCloseRef.current();
      }
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-slate-200 bg-white lg:flex">
        <Brand />
        <NavLinks current={current} onNavigate={onNavigate} />
      </aside>
      {open ? (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/40"
            aria-label="Close navigation"
            onClick={onClose}
          />
          <aside
            id="mobile-nav"
            className="stockwise-drawer fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between pe-2">
              <Brand />
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <CloseIcon />
              </button>
            </div>
            <NavLinks current={current} onNavigate={onNavigate} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-sm font-semibold text-white">
        SW
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">StockWise</p>
        <p className="text-xs text-slate-500">Inventory</p>
      </div>
    </div>
  );
}

function NavLinks({
  current,
  onNavigate,
}: {
  current: AppView;
  onNavigate: (view: AppView) => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = item.id === current;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={active ? "page" : undefined}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 ${
              active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <NavIcon id={item.id} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function NavIcon({ id }: { id: AppView }) {
  if (id === "dashboard") {
    return <DashboardIcon />;
  }
  if (id === "products") {
    return <ProductsIcon />;
  }
  return <MovementsIcon />;
}

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <IconFrame>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </IconFrame>
  );
}

function ProductsIcon() {
  return (
    <IconFrame>
      <path d="M3 7.5 12 3l9 4.5" />
      <path d="M3 7.5 12 12m-9-4.5v10L12 22m0-10 9-4.5M12 12v10m9-14.5v10L12 22" />
    </IconFrame>
  );
}

function MovementsIcon() {
  return (
    <IconFrame>
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </IconFrame>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
