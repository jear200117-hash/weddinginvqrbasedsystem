import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that the URL is from our backend server
    if (!imageUrl.startsWith('https://backendv2-nasy.onrender.com/uploads/')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the image from the backend
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
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
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
