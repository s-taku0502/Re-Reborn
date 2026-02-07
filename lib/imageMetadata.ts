import exifr from 'exifr';

export type ImageCaptureMetadata = {
    capturedAt: Date | null;
    exifAvailable: boolean;
};

export async function getImageCaptureMetadata(file: File): Promise<ImageCaptureMetadata> {
    try {
        const data = await exifr.parse(file, {
            tiff: true,
            exif: true,
            xmp: false,
            gps: false,
        });

        const capturedAt =
            data?.DateTimeOriginal ||
            data?.CreateDate ||
            data?.ModifyDate ||
            null;

        if (capturedAt instanceof Date && !Number.isNaN(capturedAt.getTime())) {
            return { capturedAt, exifAvailable: true };
        }
    } catch (error) {
        console.warn('[ImageMetadata] EXIF parse failed:', error);
    }

    return { capturedAt: null, exifAvailable: false };
}
