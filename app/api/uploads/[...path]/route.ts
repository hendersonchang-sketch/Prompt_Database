
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    // Reconstruct the path from the array
    const filePathParam = params.path.join('/');

    // Security: Prevent directory traversal
    const safePath = path.normalize(filePathParam).replace(/^(\.\.(\/|\\|$))+/, '');

    // Check multiple possible locations for the file
    const searchPaths = [
        path.join(process.cwd(), 'public', 'uploads', safePath),
        path.join(process.cwd(), 'uploads', safePath), // Root uploads fallback
        path.join(process.cwd(), 'public', safePath)   // Direct public fallback
    ];

    let fullPath = '';
    let exists = false;

    for (const p of searchPaths) {
        if (fs.existsSync(p)) {
            fullPath = p;
            exists = true;
            break;
        }
    }

    if (!exists) {
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(fullPath);
        const mimeType = mime.getType(fullPath) || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
