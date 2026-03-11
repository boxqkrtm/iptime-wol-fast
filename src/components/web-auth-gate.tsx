'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

const STORAGE_KEY = 'iptime-wol-fast-auth';
type AuthStatus = 'checking' | 'locked' | 'authenticated';

type WebAuthGateProps = Readonly<{
  expectedHash: string;
  children: ReactNode;
}>;

async function hashPassword(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const inputBuffer = encoder.encode(value);
  const digest = await crypto.subtle.digest('SHA-256', inputBuffer);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function readSavedHash(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}

export function WebAuthGate({ expectedHash, children }: WebAuthGateProps) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!expectedHash) {
      setStatus('authenticated');
      return;
    }

    const savedHash = readSavedHash();
    if (savedHash && savedHash === expectedHash) {
      setStatus('authenticated');
      return;
    }

    if (savedHash) {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setStatus('locked');
  }, [expectedHash]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSubmitting(true);
      setError('');

      try {
        const nextHash = await hashPassword(password);
        if (nextHash !== expectedHash) {
          setError('비밀번호가 일치하지 않습니다.');
          setPassword('');
          return;
        }

        window.localStorage.setItem(STORAGE_KEY, nextHash);
        setStatus('authenticated');
      } catch {
        setError('해시 검증에 실패했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [expectedHash, password],
  );

  if (status === 'checking') {
    return (
      <main className="page-shell">
        <section className="dashboard-panel auth-only">
          <p className="body-copy">잠금 상태를 확인 중입니다...</p>
        </section>
      </main>
    );
  }

  if (status === 'locked') {
    return (
      <main className="page-shell">
        <section className="dashboard-panel auth-only">
          <p className="eyebrow">local auth</p>
          <h1>접근 잠금</h1>
          <p className="body-copy">
            접속 비밀번호를 입력하세요.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="iptime-web-password" className="device-label">
              비밀번호
            </label>
            <input
              id="iptime-web-password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            {error ? <p className="error-copy">{error}</p> : null}
            <button className="refresh-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '확인 중...' : '로그인'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
