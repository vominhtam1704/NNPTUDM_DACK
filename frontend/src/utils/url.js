// ============================================
// URL.JS - GLOBAL ASSET RESOLVER
// ============================================

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800';

/**
 * Resolves any image path into a full URL.
 * Handles: Absolute URLs, Backend Uploads, and System Assets.
 */
export const getAssetUrl = (path) => {
  if (!path) return FALLBACK_AVATAR;
  
  // 1. External Links (e.g. Unsplash, Cloudinary)
  if (path.startsWith('http')) return path;
  
  // 2. Local Backend Uploads (/uploads/...)
  // Since we use a proxy ("proxy": "http://localhost:5000"), 
  // simply returning the path will route it to the backend via localhost:3000
  if (path.startsWith('/uploads')) {
    return path;
  }
  
  // 3. System Assets (e.g. /images/..., /assets/...)
  // These are handled by the frontend's public folder
  return path;
};
