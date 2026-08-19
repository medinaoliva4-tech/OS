/** Accept only an inline image or an https URL — never arbitrary markup. */
const MAX_IMAGE_BYTES = 512 * 1024;

export function sanitizeImageUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.length > MAX_IMAGE_BYTES * 1.4) return null;

  if (/^data:image\/(svg\+xml|png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
    return value;
  }
  if (/^https:\/\/[^\s"'<>]+$/i.test(value)) return value;
  return null;
}
