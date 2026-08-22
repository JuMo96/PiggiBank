export const CONFIRM_AUTH_PATH = '/confirm';
export const RESET_PASSWORD_AUTH_PATH = '/reset-password';

export type AuthLinkPurpose = 'confirmation' | 'recovery';

export type ParsedAuthLink =
  | {
      code: string;
      fingerprint: string;
      ok: true;
      purpose: AuthLinkPurpose;
    }
  | {
      ok: false;
      purpose: AuthLinkPurpose | null;
      reason:
        | 'invalid-url'
        | 'missing-code'
        | 'provider-error'
        | 'unsupported-destination'
        | 'wrong-flow'
        | 'wrong-purpose';
    };

export function parseAuthLink(value: string): ParsedAuthLink {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return { ok: false, purpose: null, reason: 'invalid-url' };
  }

  if (url.protocol.toLowerCase() !== 'piggi:' || url.hostname.toLowerCase() !== 'auth') {
    return { ok: false, purpose: null, reason: 'unsupported-destination' };
  }

  const purpose = getPurpose(url.pathname);
  if (!purpose) {
    return { ok: false, purpose: null, reason: 'unsupported-destination' };
  }

  const parameters = mergeAuthParameters(url);
  if (parameters.has('error') || parameters.has('error_code')) {
    return { ok: false, purpose, reason: 'provider-error' };
  }

  if (parameters.has('access_token') || parameters.has('refresh_token')) {
    return { ok: false, purpose, reason: 'wrong-flow' };
  }

  const authType = parameters.get('type');
  if (authType && !isExpectedAuthType(purpose, authType)) {
    return { ok: false, purpose, reason: 'wrong-purpose' };
  }

  const code = parameters.get('code')?.trim() ?? '';
  if (!code || code.length > 4096) {
    return { ok: false, purpose, reason: 'missing-code' };
  }

  return {
    code,
    fingerprint: `${purpose}:${code}`,
    ok: true,
    purpose,
  };
}

export function isLikelyNetworkAuthError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : '';

  return /abort|connection|fetch|network|offline|timeout/i.test(message);
}

export function rememberProcessedAuthLink(
  processedLinks: Set<string>,
  fingerprint: string,
  maximumSize = 12,
): boolean {
  if (processedLinks.has(fingerprint)) return false;

  processedLinks.add(fingerprint);
  while (processedLinks.size > maximumSize) {
    const oldestFingerprint = processedLinks.values().next().value;
    if (!oldestFingerprint) break;
    processedLinks.delete(oldestFingerprint);
  }
  return true;
}

function getPurpose(pathname: string): AuthLinkPurpose | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath === CONFIRM_AUTH_PATH) return 'confirmation';
  if (normalizedPath === RESET_PASSWORD_AUTH_PATH) return 'recovery';
  return null;
}

function mergeAuthParameters(url: URL) {
  const parameters = new URLSearchParams(url.search);
  const fragment = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;

  if (fragment) {
    const fragmentParameters = new URLSearchParams(fragment);
    fragmentParameters.forEach((value, key) => {
      if (!parameters.has(key)) parameters.set(key, value);
    });
  }

  return parameters;
}

function isExpectedAuthType(purpose: AuthLinkPurpose, authType: string) {
  if (purpose === 'recovery') return authType === 'recovery';
  return authType === 'signup' || authType === 'email_change';
}
