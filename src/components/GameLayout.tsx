import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useIsCoarsePointer, useIsMobileLandscape } from "../hooks/useMediaQuery";
import { useT } from "../i18n";
import { SocialComments, SocialShare, openCommentsComposer } from "./Social";
import AudioButton from "./AudioButton";
import LevelButtons from "./LevelButtons";
import NumericKeypad from "./NumericKeypad";
import QuestionBox from "./QuestionBox";
import OverflowMenu from "./OverflowMenu";

function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const videoId = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.replace(/^\/+/, "")
      : (parsed.searchParams.get("v") ??
        (parsed.pathname.startsWith("/shorts/") ? parsed.pathname.split("/")[2] : null));
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

interface GameLayoutProps {
  // Controls
  muted: boolean;
  onToggleMute: () => void;
  onRestart?: () => void;

  // Keypad — fully controlled; pass onChange to make buttons live
  keypadValue: string;
  onKeypadChange?: (v: string) => void;
  onKeypadKeyInput?: (key: string) => boolean;
  onKeypadSubmit?: () => void;
  canSubmit?: boolean;
  demoBanner?: ReactNode;
  calculatorTopBanner?: ReactNode;

  // Question bar (optional)
  question?: ReactNode;
  questionShake?: boolean;

  // Progress dots (optional)
  progress?: number;
  progressTotal?: number;

  // Level buttons (optional)
  levelCount?: number;
  currentLevel?: number;
  unlockedLevel?: number;
  onLevelSelect?: (level: number) => void;

  // Dev-only screenshot capture
  onCapture?: () => void;
  onToggleSquareSnip?: () => void;
  squareSnipActive?: boolean;
  // Dev-only demo video recording
  onRecordDemo?: () => void;
  isRecordingDemo?: boolean;

  // Autopilot
  isAutopilot?: boolean;
  onCancelAutopilot?: () => void;
  isQuestionDemo?: boolean;
  onQuestionDemo?: () => void;

  // Forces keypad to stay expanded (used by autopilot when typing)
  forceKeypadExpanded?: boolean;

  // Game canvas
  children: ReactNode;
}

export default function GameLayout({
  muted,
  onToggleMute,
  onRestart,
  keypadValue,
  onKeypadChange,
  onKeypadKeyInput,
  onKeypadSubmit,
  canSubmit = false,
  demoBanner,
  calculatorTopBanner,
  question,
  questionShake = false,
  progress,
  progressTotal,
  levelCount,
  currentLevel,
  unlockedLevel,
  onLevelSelect,
  onCapture,
  onToggleSquareSnip,
  squareSnipActive = false,
  onRecordDemo,
  isRecordingDemo = false,
  isQuestionDemo = false,
  onQuestionDemo,
  forceKeypadExpanded = false,
  children,
}: GameLayoutProps) {
  const t = useT();
  const isMobileLandscape = useIsMobileLandscape();
  const isCoarsePointer = useIsCoarsePointer();
  // Minimized by default on touch devices; expanded by default on desktop
  const [calcMinimized, setCalcMinimized] = useState(() => isMobileLandscape || isCoarsePointer);
  // Effective minimized state: autopilot forces expansion when needed
  const effectiveCalcMinimized = forceKeypadExpanded ? false : calcMinimized;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/manifest.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load manifest (${response.status})`);
        }
        return response.json() as Promise<{ videoUrl?: unknown }>;
      })
      .then((manifest) => {
        if (cancelled) return;
        const rawVideoUrl = typeof manifest.videoUrl === "string" ? manifest.videoUrl.trim() : "";
        setYoutubeEmbedUrl(rawVideoUrl ? toYouTubeEmbedUrl(rawVideoUrl) : null);
      })
      .catch(() => {
        if (!cancelled) {
          setYoutubeEmbedUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleCalc() {
    setCalcMinimized((m) => !m);
  }

  function handleKeypadSubmit() {
    onKeypadSubmit?.();
    if (isMobileLandscape) {
      setCalcMinimized(true);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("social.shareTitle"),
          url: "https://interactive-maths.vercel.app/",
        });
      } catch { /* dismissed */ }
    } else {
      setShareDrawerOpen((o) => !o);
    }
  }

  const dots =
    progress !== undefined && progressTotal !== undefined
      ? Array.from({ length: progressTotal }, (_, i) => i < progress)
      : null;
  const isDesktopLayout = !isCoarsePointer;
  const dockHeight = effectiveCalcMinimized
    ? "4.5rem"
    : isMobileLandscape
      ? "19rem"
      : calculatorTopBanner
        ? "17.9rem"
        : "15.25rem";
  const dockTransition = "320ms cubic-bezier(0.22,0.72,0.2,1)";
  const desktopRailWidth = "17rem";

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col arcade-grid"
      style={{ background: "#020617" }}
    >
      {/* ── Comments drawer ──────────────────────────────────────────────── */}
      {commentsOpen && (
        <div className="social-backdrop" onClick={() => setCommentsOpen(false)} />
      )}
      <div className={`social-comments-drawer social-drawer ${commentsOpen ? "is-open" : ""}`}>
        <div className="social-drawer-header">
          {/* Add Comment on the left — opens compose area inside the iframe */}
          <button className="social-new-comment" onClick={() => openCommentsComposer()}>
            {t("toolbar.addComment")}
          </button>
          <button className="social-drawer-close" onClick={() => setCommentsOpen(false)}>
            <svg className="social-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="social-comments-shell">
          <SocialComments />
        </div>
      </div>

      {/* ── Share fallback drawer (desktop without navigator.share) ─────── */}
      {shareDrawerOpen && (
        <div className="social-backdrop" onClick={() => setShareDrawerOpen(false)} />
      )}
      <div className={`social-share-drawer social-drawer ${shareDrawerOpen ? "is-open" : ""}`}>
        <div className="social-drawer-header">
          <h2 className="m-0 text-sm font-black uppercase tracking-wider">{t("toolbar.share")}</h2>
          <button className="social-drawer-close" onClick={() => setShareDrawerOpen(false)}>
            <svg className="social-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SocialShare />
      </div>

      {youtubeModalOpen && youtubeEmbedUrl && (
        <>
          <div className="social-backdrop social-video-backdrop" onClick={() => setYoutubeModalOpen(false)} />
          <div
            className="social-video-modal"
            role="dialog"
            aria-modal="true"
            aria-label="How to play video"
          >
            <button
              type="button"
              className="social-video-modal-close"
              aria-label="Close how to play video"
              onClick={() => setYoutubeModalOpen(false)}
            >
              <CloseIcon className="social-video-modal-close-icon" aria-hidden="true" />
            </button>
            <iframe
              src={youtubeEmbedUrl}
              title="How to play video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </>
      )}

      {/* ── Top bar overlay ─────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0 z-[60] h-20 pointer-events-none">
        <div className="absolute right-2 top-2 flex items-center gap-1.5 z-[62] pointer-events-auto">
          <AudioButton muted={muted} onToggle={onToggleMute} />
          <OverflowMenu
            onRestart={onRestart}
            onCapture={onCapture}
            onToggleSquareSnip={onToggleSquareSnip}
            squareSnipActive={squareSnipActive}
            onRecordDemo={onRecordDemo}
            isRecordingDemo={isRecordingDemo}
            onQuestionDemo={onQuestionDemo}
            isQuestionDemo={isQuestionDemo}
            onShare={handleShare}
            shareActive={shareDrawerOpen}
            onToggleComments={() => setCommentsOpen((o) => !o)}
            commentsOpen={commentsOpen}
            onWatchHowToPlay={youtubeEmbedUrl ? () => setYoutubeModalOpen(true) : undefined}
            youtubeActive={youtubeModalOpen}
          />
        </div>

        <div
          className="absolute left-1/2 -translate-x-1/2 z-[61] flex flex-col items-center gap-1.5 pointer-events-auto"
          style={{ top: "0.5rem", display: isDesktopLayout ? "none" : undefined }}
        >
          {levelCount !== undefined && currentLevel !== undefined && unlockedLevel !== undefined && onLevelSelect && (
            <LevelButtons
              levelCount={levelCount}
              currentLevel={currentLevel}
              unlockedLevel={unlockedLevel}
              onSelect={onLevelSelect}
            />
          )}

          {dots && (
            <div className="flex items-center justify-center gap-1.5">
              {dots.map((filled, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full border-2 transition-all duration-300"
                  style={{
                    background: filled ? "#67e8f9" : "transparent",
                    borderColor: filled ? "#67e8f9" : "rgba(255,255,255,0.26)",
                    boxShadow: filled ? "0 0 8px rgba(103,232,249,0.8)" : undefined,
                    transform: filled ? "scale(1.15)" : "scale(1)",
                  }} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Rest: canvas + rail / dock ──────────────────────────────────── */}
      <div className="relative z-[1] flex flex-1 min-h-0 mx-0 mb-0">
        <div className="relative flex-1 min-h-0">
          <div
            className="absolute left-0 right-0 overflow-hidden"
            style={{
              top: 0,
              bottom: isDesktopLayout ? 0 : dockHeight,
              transition: `bottom ${dockTransition}, top ${dockTransition}`,
            }}
          >
            {children}
          </div>

          {demoBanner ? (
            <div
              className={`pointer-events-none absolute z-[58] flex ${
                isMobileLandscape
                  ? "bottom-20 left-0 top-0 w-12 items-center justify-start"
                  : "left-2 right-2 top-2 justify-center"
              }`}
            >
              <div
                className={
                  isMobileLandscape
                    ? "rounded-r-2xl rounded-l-none px-1.5 py-3 text-center"
                    : "max-w-2xl rounded-2xl px-5 py-1.5 text-center"
                }
                style={{
                  background: "#09104c",
                  border: "1px solid rgba(96, 165, 250, 0.75)",
                  color: "#ffffff",
                  boxShadow:
                    "0 0 24px rgba(96,165,250,0.38), 0 0 44px rgba(59,130,246,0.2)",
                  writingMode: isMobileLandscape ? "vertical-rl" : undefined,
                  textOrientation: isMobileLandscape ? "upright" : undefined,
                }}
              >
                {demoBanner}
              </div>
            </div>
          ) : null}

          {!isDesktopLayout && (
            <div
              className="absolute z-[90] flex flex-row items-stretch gap-2 pointer-events-auto"
              style={{
                bottom: "3px",
                left: "2px",
                right: "2px",
                height: dockHeight,
                transition: `height ${dockTransition}`,
              }}
            >
              {question !== undefined && (
                <div className="flex-1 min-w-0 pointer-events-auto">
                  <QuestionBox shake={questionShake} onClick={toggleCalc}>
                    {question}
                  </QuestionBox>
                </div>
              )}

              <div className="flex min-h-0 flex-col self-start">
                {calculatorTopBanner ? (
                  <div
                    className="arcade-panel px-3 py-2 text-center text-[1rem] font-bold leading-tight text-white"
                    style={{
                      background: "rgba(250,204,21,0.12)",
                      borderColor: "#facc15",
                      borderWidth: "3px",
                      color: "#fde047",
                      marginBottom: "2px",
                    }}
                  >
                    {calculatorTopBanner}
                  </div>
                ) : null}
                <NumericKeypad
                  value={keypadValue}
                  onChange={onKeypadChange}
                  onKeyInput={onKeypadKeyInput}
                  onSubmit={handleKeypadSubmit}
                  canSubmit={canSubmit}
                  minimized={effectiveCalcMinimized}
                  onToggleMinimized={toggleCalc}
                />
              </div>
            </div>
          )}
        </div>

        {isDesktopLayout && (
          <aside
            className="relative z-[65] flex h-full shrink-0 flex-col px-2 pb-3 pt-3"
            style={{
              width: desktopRailWidth,
              background:
                "linear-gradient(180deg, rgba(4,12,28,0.94), rgba(2,6,23,0.98))",
              borderLeft: "1px solid rgba(148,163,184,0.14)",
              boxShadow:
                "inset 12px 0 24px rgba(2,6,23,0.34), inset 0 0 0 1px rgba(51,65,85,0.18)",
            }}
          >
            {levelCount !== undefined && currentLevel !== undefined && unlockedLevel !== undefined && onLevelSelect && (
              <LevelButtons
                levelCount={levelCount}
                currentLevel={currentLevel}
                unlockedLevel={unlockedLevel}
                onSelect={onLevelSelect}
              />
            )}

            {dots && (
              <div className="mt-2 flex items-center justify-center gap-1.5">
                {dots.map((filled, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded-full border-2 transition-all duration-300"
                    style={{
                      background: filled ? "#67e8f9" : "transparent",
                      borderColor: filled ? "#67e8f9" : "rgba(255,255,255,0.26)",
                      boxShadow: filled ? "0 0 8px rgba(103,232,249,0.8)" : undefined,
                      transform: filled ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-hidden pt-3">
              {question !== undefined && (
                <div className="mb-2">
                  <QuestionBox shake={questionShake} onClick={toggleCalc}>
                    {question}
                  </QuestionBox>
                </div>
              )}
              <div className="flex min-h-0 flex-col">
                {calculatorTopBanner ? (
                  <div
                    className="arcade-panel px-3 py-2 text-center text-[1rem] font-bold leading-tight text-white"
                    style={{
                      background: "rgba(250,204,21,0.12)",
                      borderColor: "#facc15",
                      borderWidth: "3px",
                      color: "#fde047",
                      marginBottom: "2px",
                    }}
                  >
                    {calculatorTopBanner}
                  </div>
                ) : null}
                <NumericKeypad
                  value={keypadValue}
                  onChange={onKeypadChange}
                  onKeyInput={onKeypadKeyInput}
                  onSubmit={handleKeypadSubmit}
                  canSubmit={canSubmit}
                  minimized={effectiveCalcMinimized}
                  onToggleMinimized={toggleCalc}
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
