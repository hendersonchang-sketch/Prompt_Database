import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'Missing image' }, { status: 400 });
        }

        const inputBuffer = Buffer.from(imageBase64, 'base64');

        // Get metadata to determine current size
        const metadata = await sharp(inputBuffer).metadata();

        // Target 4K Upscale (e.g., width 3840 or height 2160, whichever is larger dimension logic, or just 4x)
        // Let's safe-guard: If it's small, scale 4x. If it's already large, scale to 4K width.

        let targetWidth = (metadata.width || 1024) * 4;

        // Cap max width at 4K standard to prevent insane file sizes if input is already big
        // but user asked for "Real 4K", so let's aim for 3840w as a baseline if the image is landscape,
        // or ensure it's at least significantly bigger.
        // Actually, "Upscale 4x" is safer for "True 4k Upscale" feature usually implies SuperRes.
        // Lanczos-3 is good.

        // Let's enforce a minimum width of 3840 for "4K" feeling, unless image is tiny.
        const currentWidth = metadata.width || 0;
        const scaleFactor = 4;

        // Define 4K UHD width
        const UHD_WIDTH = 3840;

        if (currentWidth * scaleFactor > 8192) {
            // Too big? Cap it? No, let's just do 4x as requested or fixed 4k?
            // "4K Upscale" usually means "Make it 4K resolution".
            targetWidth = UHD_WIDTH;
        } else {
            targetWidth = currentWidth * scaleFactor;
            // If result is still < 4K, stick to 4x. 
            // If result > 4K, let it be high res.
        }

        // Perform Upscale
        const upscaledBuffer = await sharp(inputBuffer)
            .resize({
                width: Math.round(targetWidth),
                kernel: sharp.kernel.lanczos3, // High quality interpolation
                withoutEnlargement: false
            })
            // Enhance sharpness slightly to simulate SuperRes "crispness"
            .sharpen({
                sigma: 1.0,
                m1: 1.0,
                m2: 1.0,
                x1: 2,
                y2: 10,
                y3: 20,
            })
            .toFormat('png')
            .toBuffer();

        const resultBase64 = upscaledBuffer.toString('base64');

        return NextResponse.json({
            imageBase64: resultBase64,
            mimeType: 'image/png'
        });

    } catch (error: any) {
        console.error("Upscale failed:", error);
        return NextResponse.json({ error: error.message || 'Upscale failed' }, { status: 500 });
    }
}
