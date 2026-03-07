import type { WolDevice } from '@/lib/iptime/types';

type WolDeviceItemProps = {
  device: WolDevice;
  isWaking: boolean;
  onWake: (device: WolDevice) => Promise<void> | void;
};

export function WolDeviceItem({ device, isWaking, onWake }: WolDeviceItemProps) {
  return (
    <article className="device-card">
      <div>
        <p className="device-label">장치</p>
        <h2>{device.name}</h2>
        <p className="device-meta">{device.mac}</p>
      </div>
      <button className="wake-button" type="button" onClick={() => onWake(device)} disabled={isWaking}>
        {isWaking ? '전송 중...' : '지금 깨우기'}
      </button>
    </article>
  );
}
