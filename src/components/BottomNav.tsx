export type Tab = "home" | "journal" | "settings";

const ITEMS: { tab: Tab; label: string; icon: JSX.Element }[] = [
  {
    tab: "home",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path
          d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    tab: "journal",
    label: "Journal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path
          d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Zm0 0v14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 8h6M9 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tab: "settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 3v2m0 14v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M3 12h2m14 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BottomNav({
  current,
  onChange,
}: {
  current: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-forest-100 bg-cream-50/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = current === item.tab;
          return (
            <li key={item.tab} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.tab)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-xs font-semibold transition ${
                  active ? "text-forest-700" : "text-bark-500 hover:text-forest-600"
                }`}
              >
                <span className={active ? "animate-pop-in" : ""}>{item.icon}</span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
