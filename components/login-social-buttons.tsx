"use client";

/**
 * Pieslēgšanās ar Google / Apple - pagaidām tikai UI.
 * Kad būs OAuth (piem. Supabase), šeit izsauc signInWithOAuth.
 */
export function LoginSocialButtons() {
  return (
    <div className="auth-social">
      <div className="auth-social-divider" role="presentation">
        <span className="auth-social-divider-line" aria-hidden="true" />
        <span className="auth-social-divider-text">vai turpināt ar</span>
        <span className="auth-social-divider-line" aria-hidden="true" />
      </div>
      <div className="auth-social-buttons">
        <button
          type="button"
          className="btn btn-social btn-social-google btn-block"
          aria-label="Turpināt ar Google kontu"
        >
          <i className="fa-brands fa-google" aria-hidden="true" />
          <span className="btn-social-label">Turpināt ar Google</span>
        </button>
        <button
          type="button"
          className="btn btn-social btn-social-apple btn-block"
          aria-label="Turpināt ar Apple kontu"
        >
          <i className="fa-brands fa-apple" aria-hidden="true" />
          <span className="btn-social-label">Turpināt ar Apple</span>
        </button>
      </div>
    </div>
  );
}
