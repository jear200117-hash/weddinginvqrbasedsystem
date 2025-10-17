import { NextResponse } from 'next/server';

// Expected env vars (set in .env.local):
// CLOUDINARY_CLOUD_NAME=ddjopmdsi
// CLOUDINARY_API_KEY=xxxx
// CLOUDINARY_API_SECRET=yyyy

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line no-console
  console.log('[cloudinary-v2 manifest] Using cloud name:', CLOUD_NAME);
}

async function fetchResources(prefix: string) {
  const base = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`;
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

  const all: any[] = [];
  let nextCursor: string | undefined = undefined;

  do {
    const url = new URL(base);
    url.searchParams.set('type', 'upload');
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('max_results', '500');
    if (nextCursor) url.searchParams.set('next_cursor', nextCursor);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      // Force server-side
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    if (Array.isArray(data.resources)) {
      all.push(...data.resources);
    }
    nextCursor = data.next_cursor;
  } while (nextCursor);

  return all;
}

function buildManifest(resources: any[]) {
  // Map numeric index -> versioned publicId (e.g., v1760624560/newimgs/imgs_1_wwdo3w.jpg)
  const manifest: Record<number, string> = {};
  const re = /(^|\/)imgs_(\d+)(?:_|$)/; // matches .../imgs_123_...

  for (const r of resources) {
    const publicId: string = r.public_id; // e.g., newimgs/imgs_1_wwdo3w
    const version: number | undefined = r.version; // e.g., 1760624560
    const format: string | undefined = r.format; // e.g., 'jpg'

    const m = publicId.match(re);
    if (!m) continue;
    const idx = parseInt(m[2], 10);
    if (!Number.isFinite(idx)) continue;

    const versionPrefix = version ? `v${version}/` : '';
    const withExt = format ? `${publicId}.${format}` : publicId;
    manifest[idx] = `${versionPrefix}${withExt}`;
  }

  return manifest;
}

export async function GET(req: Request) {
  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: 'Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const prefix = url.searchParams.get('prefix') ?? 'newimgs/imgs_';
    const format = url.searchParams.get('format') ?? 'json'; // json | ts

    const resources = await fetchResources(prefix);
    const manifest = buildManifest(resources);

    if (format === 'ts') {
      const ts = `export const V2_IMAGE_MANIFEST: Record<number, string> = ${JSON.stringify(manifest, null, 2)};\n`;
      return new NextResponse(ts, {
        headers: { 'content-type': 'application/typescript; charset=utf-8' },
      });
    }

    return NextResponse.json({ count: Object.keys(manifest).length, manifest });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
