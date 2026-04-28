import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BUILT_IN_LOCALES, LOCALE_NAMES, useLocale, useT } from "../i18n";

const FLAG_EMOJI: Record<string, string> = {
  en: "\u{1F1EC}\u{1F1E7}",
  zh: "\u{1F1E8}\u{1F1F3}",
  hi: "\u{1F1EE}\u{1F1F3}",
};

interface OverflowMenuProps {
  onRestart?: () => void;
  onCapture?: () => void;
  onToggleSquareSnip?: () => void;
  squareSnipActive?: boolean;
  onRecordDemo?: () => void;
  isRecordingDemo?: boolean;
  onQuestionDemo?: () => void;
  isQuestionDemo?: boolean;
  onShare?: () => void;
  shareActive?: boolean;
  onToggleComments?: () => void;
  commentsOpen?: boolean;
  onWatchHowToPlay?: () => void;
  youtubeActive?: boolean;
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="white" strokeWidth="2.2" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="4" ry="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SnipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="4.5" width="15" height="15" rx="2" strokeDasharray="2.5 2.5" />
      <path d="M8.5 9.5h1.3l.8-1.4h2.8l.8 1.4h1.3a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 1-1.5-1.5v-4a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="12" cy="13" r="1.9" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="13" height="16" rx="2" />
      <path d="m22 7-5 3.5V14l5 3.5Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SolveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="5" />
      <circle cx="12" cy="1.5" r="1.2" fill="currentColor" stroke="none" />
      <rect x="4" y="5" width="16" height="12" rx="2.5" />
      <circle cx="9" cy="10" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="2" fill="currentColor" stroke="none" />
      <path d="M8.5 13.5 Q12 15.5 15.5 13.5" />
      <line x1="9" y1="17" x2="9" y2="20" />
      <line x1="15" y1="17" x2="15" y2="20" />
      <line x1="7" y1="20" x2="17" y2="20" />
    </svg>
  );
}

function MenuItem({
  active,
  onClick,
  icon,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-menu-item ${active ? "is-active" : ""}`}
    >
      <span className="overflow-menu-item-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="overflow-menu-item-label">{label}</span>
    </button>
  );
}

export default function OverflowMenu({
  onRestart,
  onCapture,
  onToggleSquareSnip,
  squareSnipActive = false,
  onRecordDemo,
  isRecordingDemo = false,
  onQuestionDemo,
  isQuestionDemo = false,
  onShare,
  shareActive = false,
  onToggleComments,
  commentsOpen = false,
  onWatchHowToPlay,
  youtubeActive = false,
}: OverflowMenuProps) {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const localeCodes = useMemo(() => Object.keys(BUILT_IN_LOCALES), []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        setLanguagesOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setLanguagesOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setLanguagesOpen(false);
  }

  function runAction(action?: () => void) {
    closeMenu();
    action?.();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={t("toolbar.menu")}
        aria-label={t("toolbar.menu")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="menu-launcher arcade-button h-10 w-10 flex items-center justify-center p-2"
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          className="overflow-menu-panel"
          role="menu"
          aria-label={t("toolbar.menu")}
        >
          {onRestart && <MenuItem onClick={() => runAction(onRestart)} icon={<RestartIcon />} label={t("toolbar.restart")} />}
          <button
            type="button"
            className={`overflow-menu-language-toggle ${languagesOpen ? "is-open" : ""}`}
            onClick={() => setLanguagesOpen((value) => !value)}
            aria-expanded={languagesOpen}
          >
            <span className="overflow-menu-item-icon" aria-hidden="true">
              <GlobeIcon />
            </span>
            <span className="overflow-menu-item-label">{t("lang.label")}</span>
            <span className="overflow-menu-language-caret" aria-hidden="true">
              {languagesOpen ? "▾" : "▸"}
            </span>
          </button>

          {languagesOpen && (
            <div className="overflow-menu-language-list" role="group" aria-label={t("lang.label")}>
              {localeCodes.map((code) => {
                const isActive = code === locale;
                return (
                  <button
                    key={code}
                    type="button"
                    className={`overflow-menu-language-item ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      setLocale(code);
                      closeMenu();
                    }}
                  >
                    <span className="overflow-menu-language-flag" aria-hidden="true">
                      {FLAG_EMOJI[code] ?? "\u{1F310}"}
                    </span>
                    <span className="overflow-menu-item-label">{LOCALE_NAMES[code] || code}</span>
                    {isActive && <span className="overflow-menu-language-check" aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {onQuestionDemo && (
            <MenuItem
              onClick={() => runAction(onQuestionDemo)}
              icon={<SolveIcon />}
              label={t("toolbar.showSolve")}
              active={isQuestionDemo}
            />
          )}

          {onShare && (
            <MenuItem
              onClick={() => runAction(onShare)}
              icon={<ShareIcon />}
              label={t("toolbar.share")}
              active={shareActive}
            />
          )}

          {onToggleComments && (
            <MenuItem
              onClick={() => runAction(onToggleComments)}
              icon={<CommentIcon />}
              label={t("toolbar.comments")}
              active={commentsOpen}
            />
          )}

          {onWatchHowToPlay && (
            <MenuItem
              onClick={() => runAction(onWatchHowToPlay)}
              icon={<VideoIcon />}
              label={t("toolbar.watchHowToPlay")}
              active={youtubeActive}
            />
          )}

          {onCapture && (
            <MenuItem
              onClick={() => runAction(onCapture)}
              icon={<CameraIcon />}
              label={t("toolbar.screenshot")}
            />
          )}

          {onToggleSquareSnip && (
            <MenuItem
              onClick={() => runAction(onToggleSquareSnip)}
              icon={<SnipIcon />}
              label={squareSnipActive ? t("toolbar.hideSquareSnip") : t("toolbar.showSquareSnip")}
              active={squareSnipActive}
            />
          )}

          {onRecordDemo && !isRecordingDemo && (
            <MenuItem
              onClick={() => runAction(onRecordDemo)}
              icon={<VideoIcon />}
              label={t("toolbar.recordDemo")}
            />
          )}
        </div>
      )}
    </div>
  );
}
