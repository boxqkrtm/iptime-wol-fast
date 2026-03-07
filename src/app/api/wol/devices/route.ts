import { NextResponse } from 'next/server';

import { readIptimeConfig } from '@/lib/env';
import { IptimeClient } from '@/lib/iptime/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = new IptimeClient(readIptimeConfig());
    const devices = await client.listWolDevices();

    return NextResponse.json({ devices });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load WOL devices',
      },
      { status: 500 },
    );
  }
}
