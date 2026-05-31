import {
  NATIVE_SHELL_BACKGROUND,
  NATIVE_SHELL_LOGO_PATH,
} from "@/lib/capacitor/native-shell-brand";

/** SSR boot overlay – rāda NativeShellPaintGuard, kamēr gaida React. */
export function NativeShellBootLayer({ loadingText }: { loadingText: string }) {
  return (
    <div
      id="subtrack-native-boot"
      hidden
      className="cap-native-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        background: NATIVE_SHELL_BACKGROUND,
        padding: "1.5rem",
      }}
    >
      <div className="cap-native-loading-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={NATIVE_SHELL_LOGO_PATH}
          alt=""
          className="cap-native-loading-logo"
          width={96}
          height={96}
          decoding="async"
        />
        <p className="cap-native-loading-text">{loadingText}</p>
        <div className="cap-native-loading-bar" aria-hidden="true">
          <div
            id="subtrack-native-boot-progress"
            className="cap-native-loading-bar-fill"
            style={{ width: "12%" }}
          />
        </div>
      </div>
    </div>
  );
}
