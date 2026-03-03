import { useCallback, useState } from 'react';
import { useClient } from 'sanity';
import { API_VERSION, SCHEMA_TYPE } from '../constants';
import { collectReferenceIds, nullifyMissingRefs } from '../utils/references';
import type { DeletedDocument, RestoreResult, ReferenceCheckResult } from '../types';

interface UseRestoreDocumentResult {
  restore: (deletedDoc: DeletedDocument) => Promise<RestoreResult>;
  checkReferences: (deletedDoc: DeletedDocument) => Promise<ReferenceCheckResult>;
  restoring: boolean;
  error: Error | null;
}

export function useRestoreDocument(): UseRestoreDocumentResult {
  const client = useClient({ apiVersion: API_VERSION });
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkReferences = useCallback(
    async (deletedDoc: DeletedDocument): Promise<ReferenceCheckResult> => {
      const referencedIds = deletedDoc.referencedDocumentIds || [];

      if (referencedIds.length === 0) {
        return { existingIds: [], missingIds: [] };
      }

      // Query for existing documents
      const existingDocs = await client.fetch<Array<{ _id: string }>>(
        `*[_id in $ids]{ _id }`,
        { ids: referencedIds }
      );

      const existingIdsSet = new Set(existingDocs.map((d) => d._id));
      const existingIds: string[] = [];
      const missingIds: string[] = [];

      for (const id of referencedIds) {
        if (existingIdsSet.has(id)) {
          existingIds.push(id);
        } else {
          missingIds.push(id);
        }
      }

      return { existingIds, missingIds };
    },
    [client]
  );

  const restore = useCallback(
    async (deletedDoc: DeletedDocument): Promise<RestoreResult> => {
      setRestoring(true);
      setError(null);

      try {
        // Parse the JSON snapshot and clone it
        const parsedSnapshot = JSON.parse(deletedDoc.documentSnapshot);
        const snapshot = { ...parsedSnapshot } as Record<string, unknown>;

        // Check for missing references
        const { missingIds } = await checkReferences(deletedDoc);
        const nullifiedReferences: string[] = [];

        if (missingIds.length > 0) {
          // Nullify missing references in the snapshot
          const missingIdsSet = new Set(missingIds);
          nullifyMissingRefs(snapshot, missingIdsSet, nullifiedReferences);
        }

        // Remove Sanity system fields that shouldn't be copied
        delete snapshot._rev;
        delete snapshot._updatedAt;
        delete snapshot._createdAt;

        // Ensure the document has its original ID and type
        snapshot._id = deletedDoc.originalDocumentId;
        snapshot._type = deletedDoc.originalType;

        // Use createOrReplace to restore the document
        await client.createOrReplace(snapshot as { _id: string; _type: string; [key: string]: unknown });

        // Delete the deleted document record from recycle bin
        await client.delete(deletedDoc._id);

        return {
          success: true,
          documentId: deletedDoc.originalDocumentId,
          nullifiedReferences: nullifiedReferences.length > 0 ? nullifiedReferences : undefined,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to restore document';
        setError(err instanceof Error ? err : new Error(errorMessage));
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setRestoring(false);
      }
    },
    [client, checkReferences]
  );

  return { restore, checkReferences, restoring, error };
}
