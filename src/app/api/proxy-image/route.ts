import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Allow our backend uploads and Google Drive CDN URLs
    const allowed = [
      'http://localhost:5000/uploads/',
      'https://drive.google.com/',
      'https://lh3.googleusercontent.com/'
    ];
    if (!allowed.some(prefix => imageUrl.startsWith(prefix))) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch with simple retry (handles 429 burst limits)
    const maxAttempts = 3;
    const baseDelayMs = 250;
    let response: Response | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      response = await fetch(imageUrl, { cache: 'no-store' });
      if (response.ok) break;
      // Retry on 429/5xx
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      break;
    }
    
    if (!response || !response.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache in CDN/browser to reduce repeated hits to Drive
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
