import {useEffect, useRef, useCallback} from 'react'
import {useClient} from 'sanity'
import {API_VERSION, SCHEMA_TYPE, PURGE_BATCH_SIZE} from '../constants'

interface UseAutoPurgeOptions {
  onPurged?: (count: number) => void
  onError?: (error: Error) => void
}

export function useAutoPurge(options: UseAutoPurgeOptions = {}): void {
  const {onPurged, onError} = options
  const client = useClient({apiVersion: API_VERSION})
  const hasRunRef = useRef(false)

  const purgeExpiredDocuments = useCallback(async () => {
    try {
      // Query for expired documents
      const expiredDocs = await client.fetch<Array<{_id: string}>>(
        `*[_type == $type && expiresAt < now()][0...${PURGE_BATCH_SIZE}]{ _id }`,
        {type: SCHEMA_TYPE},
      )

      if (expiredDocs.length === 0) {
        return
      }

      // Delete in batches
      const transaction = client.transaction()
      for (const doc of expiredDocs) {
        transaction.delete(doc._id)
      }
      await transaction.commit()

      onPurged?.(expiredDocs.length)

      // If we hit the batch limit, there might be more to purge
      if (expiredDocs.length === PURGE_BATCH_SIZE) {
        // Recursively purge more documents
        await purgeExpiredDocuments()
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to purge expired documents')
      onError?.(error)
    }
  }, [client, onPurged, onError])

  useEffect(() => {
    // Only run once on mount
    if (hasRunRef.current) return
    hasRunRef.current = true

    purgeExpiredDocuments()
  }, [purgeExpiredDocuments])
}
