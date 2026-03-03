// Main plugin export
export { recycleBin } from './plugin';

// Types
export type {
  RecycleBinPluginConfig,
  DeletedDocument,
  DeletedByUser,
  RestoreResult,
  ReferenceCheckResult,
} from './types';

// Constants
export { RETENTION_DAYS, SCHEMA_TYPE, API_VERSION } from './constants';

// Hooks (for advanced usage)
export { useDeletedDocuments } from './hooks/useDeletedDocuments';
export { useRestoreDocument } from './hooks/useRestoreDocument';
export { useAutoPurge } from './hooks/useAutoPurge';

// Utils (for advanced usage)
export { collectReferenceIds, nullifyMissingRefs, getDocumentTitle } from './utils/references';
