import { useState } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

const BTN =
  "display text-lg leading-none cursor-pointer text-[#f5f3ef] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:opacity-70";

export function AuthNav() {
  const { user, loading, signOut } = useAuth();
  const { settings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) return null;

  if (user) {
    const displayName =
      settings.profile.name || user.email?.split("@")[0] || "Account";
    const initial = displayName.charAt(0).toUpperCase();
    const avatarUrl = settings.profile.photo;
    return (
      <div className="auth-nav-user">
        <button
          type="button"
          className="auth-nav-avatar-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label={`Open settings for ${displayName}`}
          title={displayName}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="auth-nav-avatar-img" />
          ) : (
            <span className="auth-nav-avatar" aria-hidden="true">
              {initial}
            </span>
          )}
        </button>
        <button
          type="button"
          className="auth-icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          title="Settings"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.55V3a2 2 0 1 1 4 0v.09c0 .68.4 1.29 1.03 1.51.63.24 1.34.11 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87c.22.63.83 1.03 1.51 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => signOut()}
          className="auth-signout"
          aria-label="Sign out"
        >
          <span className="auth-signout-label">Sign out</span>
          <svg
            className="auth-signout-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        </button>
        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <AuthDialog
        defaultMode="login"
        trigger={
          <button type="button" className={BTN}>
            Log in
          </button>
        }
      />
      <AuthDialog
        defaultMode="signup"
        trigger={
          <button type="button" className="signup-hover-circle display text-lg leading-none">
            Sign up
          </button>
        }
      />
    </div>
  );
}
