/**
 * Utility to parse and convert various Google Drive file links to high-speed, direct image embed URLs
 */
export function convertGoogleDriveImageUrl(rawUrl: string): { directUrl: string; isGoogleDrive: boolean; fileId: string | null } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { directUrl: '', isGoogleDrive: false, fileId: null };
  }

  const trimmed = rawUrl.trim();

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const matchFileD = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) {
    const fileId = matchFileD[1];
    return {
      directUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      isGoogleDrive: true,
      fileId,
    };
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or id=FILE_ID
  const matchIdParam = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) {
    const fileId = matchIdParam[1];
    return {
      directUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      isGoogleDrive: true,
      fileId,
    };
  }

  // Pattern 3: https://drive.google.com/uc?id=FILE_ID...
  const matchUc = trimmed.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/i);
  if (matchUc && matchUc[1]) {
    const fileId = matchUc[1];
    return {
      directUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      isGoogleDrive: true,
      fileId,
    };
  }

  // Pattern 4: googleusercontent already
  if (trimmed.includes('googleusercontent.com/d/')) {
    return { directUrl: trimmed, isGoogleDrive: true, fileId: null };
  }

  // Non-drive standard direct image URL
  return { directUrl: trimmed, isGoogleDrive: false, fileId: null };
}
