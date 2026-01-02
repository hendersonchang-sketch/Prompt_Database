
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Saves a Base64 image string to the local filesystem.
 * @param base64Data The Base64 string (with or without data URI prefix).
 * @param prefix Optional filename prefix.
 * @returns The public URL path (e.g., "/uploads/image-123.png").
 */
export async function saveImageToDisk(base64Data: string, prefix: string = 'img'): Promise<string> {
    try {
        // Strip data URI prefix if present
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate filename
        const timestamp = Date.now();
        const randomId = crypto.randomBytes(4).toString('hex');
        const filename = `${prefix}-${timestamp}-${randomId}.png`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        await fs.promises.writeFile(filepath, base64Image, 'base64');

        // Return relative public path
        return `/uploads/${filename}`;
    } catch (error) {
        console.error("Failed to save image to disk:", error);
        throw new Error("Image storage failed");
    }
}
