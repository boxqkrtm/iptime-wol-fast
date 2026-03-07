import { NextResponse } from 'next/server';
import { z } from 'zod';

import { readIptimeConfig } from '@/lib/env';
import { IptimeClient } from '@/lib/iptime/client';

const bodySchema = z.object({
  mac: z.string().min(1),
  name: z.string().optional(),
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const client = new IptimeClient(readIptimeConfig());

    await client.wakeDevice(body.mac);

    return NextResponse.json({
      ok: true,
      mac: body.mac,
      name: body.name ?? body.mac,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send WOL signal';
    const status = error instanceof z.ZodError ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
