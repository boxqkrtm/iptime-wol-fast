import { WolDashboard } from '@/components/wol-dashboard';
import { WebAuthGate } from '@/components/web-auth-gate';

export default function HomePage() {
  const expectedPasswordHash = process.env.WOL_WEB_PASSWORD_HASH?.trim() ?? '';

  return (
    <main className="page-shell">
      <WebAuthGate expectedHash={expectedPasswordHash}>
        <WolDashboard />
      </WebAuthGate>
    </main>
  );
}
