/**
 * Pure, client-safe Brand Kit constants (Phase 22). No server imports — safe to
 * import from both client components and server modules. Keep data-layer functions
 * (which import the server-only workspace/tenant code) in lib/brandkit.ts.
 */
export const ASSET_TYPES = ['logo', 'brand_image', 'product_image', 'document', 'link', 'other'] as const;
export const ASSET_PERMISSIONS = ['user_provided', 'permission_cleared', 'needs_review', 'unknown'] as const;

export const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: 'Logo', brand_image: 'Brand image', product_image: 'Product image',
  document: 'Document', link: 'Link / reference', other: 'Other',
};
export const ASSET_PERMISSION_LABELS: Record<string, string> = {
  user_provided: 'User-provided', permission_cleared: 'Permission-cleared',
  needs_review: 'Needs review', unknown: 'Unknown',
};
