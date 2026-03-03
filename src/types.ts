import type { SanityDocument } from 'sanity';

export interface RecycleBinPluginConfig {
  /**
   * Number of days to retain deleted documents before auto-purge.
   * Default: 30
   */
  retentionDays?: number;
  /**
   * Document types that can be soft-deleted
   * If not specified, all types are deletable
   */
  deletableTypes?: string[];
  /**
   * Document types to exclude from soft-delete
   * These types will use standard hard delete
   */
  excludeTypes?: string[];
}

export interface DeletedByUser {
  id: string;
  name: string;
  email?: string;
}

export interface DeletedDocument extends SanityDocument {
  _type: 'recycleBin.deletedDocument';
  originalDocumentId: string;
  originalType: string;
  siteId?: string;
  deletedAt: string;
  deletedBy: DeletedByUser;
  expiresAt: string;
  documentTitle: string;
  /** JSON-stringified document snapshot */
  documentSnapshot: string;
  referencedDocumentIds: string[];
}

export interface RestoreResult {
  success: boolean;
  documentId?: string;
  nullifiedReferences?: string[];
  error?: string;
}

export interface ReferenceCheckResult {
  existingIds: string[];
  missingIds: string[];
}
