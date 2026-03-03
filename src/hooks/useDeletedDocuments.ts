import { useEffect, useState, useCallback } from 'react';
import { useClient, useWorkspace } from 'sanity';
import { API_VERSION, SCHEMA_TYPE } from '../constants';
import type { DeletedDocument } from '../types';

interface UseDeletedDocumentsOptions {
  typeFilter?: string;
  searchQuery?: string;
}

interface UseDeletedDocumentsResult {
  documents: DeletedDocument[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useDeletedDocuments(
  options: UseDeletedDocumentsOptions = {}
): UseDeletedDocumentsResult {
  const { typeFilter, searchQuery } = options;
  const client = useClient({ apiVersion: API_VERSION });
  const workspace = useWorkspace();
  const [documents, setDocuments] = useState<DeletedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdminWorkspace = workspace?.name === 'admin';

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocuments() {
      setLoading(true);
      setError(null);

      try {
        // Build query conditions
        const conditions: string[] = [`_type == "${SCHEMA_TYPE}"`];

        // Filter by siteId for non-admin workspaces
        if (!isAdminWorkspace && workspace?.name) {
          conditions.push(`siteId == $siteId`);
        }

        // Filter by document type
        if (typeFilter) {
          conditions.push(`originalType == $typeFilter`);
        }

        // Filter by search query (searches title)
        if (searchQuery) {
          conditions.push(`documentTitle match $searchQuery`);
        }

        const query = `*[${conditions.join(' && ')}] | order(deletedAt desc)`;
        const params: Record<string, unknown> = {};

        if (!isAdminWorkspace && workspace?.name) {
          params.siteId = workspace.name;
        }
        if (typeFilter) {
          params.typeFilter = typeFilter;
        }
        if (searchQuery) {
          params.searchQuery = `*${searchQuery}*`;
        }

        const result = await client.fetch<DeletedDocument[]>(query, params);

        if (!cancelled) {
          setDocuments(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch deleted documents'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, [client, isAdminWorkspace, workspace?.name, typeFilter, searchQuery, refreshKey]);

  return { documents, loading, error, refresh };
}
