const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Upload a JPG, PNG, WEBP, or other image file.';
  }
  if (file.size === 0) return 'The uploaded image is empty.';
  if (file.size > MAX_IMAGE_BYTES) return 'The uploaded image must be 10 MB or smaller.';
  return null;
}
