'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { WolDevice } from '@/lib/iptime/types';

import { WolDeviceItem } from './wol-device-item';

type DevicesResponse = {
  devices?: WolDevice[];
  error?: string;
};

type WakeResponse = {
  ok?: boolean;
  error?: string;
};

export function WolDashboard() {
  const [devices, setDevices] = useState<WolDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wakingId, setWakingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('공유기에서 WOL 장치 목록을 불러오는 중입니다.');

  const hasDevices = devices.length > 0;

  const loadDevices = useCallback(async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const response = await fetch('/api/wol/devices', { cache: 'no-store' });
      const body = (await response.json()) as DevicesResponse;

      if (!response.ok || body.error) {
        throw new Error(body.error ?? 'WOL 장치 목록을 불러오지 못했습니다.');
      }

      const nextDevices = body.devices ?? [];
      setDevices(nextDevices);
      setStatusMessage(
        nextDevices.length > 0
          ? `${nextDevices.length}개의 WOL 장치를 찾았습니다. 장치를 누르면 즉시 깨우기 신호를 보냅니다.`
          : '등록된 WOL 장치가 없습니다. 공유기 관리자 페이지에서 WOL 목록을 확인해 주세요.',
      );
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'WOL 장치 목록을 불러오지 못했습니다.';
      setDevices([]);
      setError(message);
      setStatusMessage('목록을 불러오지 못했습니다. 환경변수와 공유기 연결 상태를 확인해 주세요.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices('initial');
  }, [loadDevices]);

  const handleWake = useCallback(async (device: WolDevice) => {
    setWakingId(device.id);
    setError(null);
    setStatusMessage(`${device.name}에 WOL 신호를 보내는 중입니다...`);

    try {
      const response = await fetch('/api/wol/wake', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          mac: device.mac,
          name: device.name,
        }),
      });

      const body = (await response.json()) as WakeResponse;
      if (!response.ok || body.error) {
        throw new Error(body.error ?? 'WOL 신호 전송에 실패했습니다.');
      }

      setStatusMessage(`${device.name}에 WOL 신호를 보냈습니다.`);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'WOL 신호 전송에 실패했습니다.';
      setError(message);
      setStatusMessage(`${device.name} 깨우기에 실패했습니다.`);
    } finally {
      setWakingId(null);
    }
  }, []);

  const statusClassName = useMemo(() => (error ? 'status-banner status-error' : 'status-banner'), [error]);

  return (
    <section className="dashboard-panel">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">server-side only</p>
          <h1>ipTIME WOL Fast</h1>
          <p className="body-copy">
            공유기 자격증명은 서버에서만 사용합니다. 브라우저는 내부 API만 호출하고, 목록과 깨우기 버튼만 표시합니다.
          </p>
        </div>
        <button className="refresh-button" type="button" onClick={() => void loadDevices('refresh')} disabled={isRefreshing || isLoading}>
          {isRefreshing ? '새로고침 중...' : '목록 새로고침'}
        </button>
      </div>

      <div className={statusClassName} role="status">
        {isLoading ? '로딩 중...' : statusMessage}
      </div>

      {error ? <p className="error-copy">{error}</p> : null}

      {hasDevices ? (
        <div className="device-grid">
          {devices.map((device) => (
            <WolDeviceItem key={device.id} device={device} isWaking={wakingId === device.id} onWake={handleWake} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>등록된 장치가 아직 없습니다.</p>
          <p className="device-meta">공유기 WOL 페이지에 장치를 먼저 등록한 뒤 새로고침하세요.</p>
        </div>
      )}
    </section>
  );
}
