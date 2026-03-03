import {useCallback, useState, useMemo} from 'react'
import {
  useClient,
  useCurrentUser,
  useDocumentOperation,
  type DocumentActionComponent,
  type DocumentActionProps,
  type DocumentActionDescription,
} from 'sanity'
import {useToast, Button, Dialog, Box, Card, Stack, Text, Flex} from '@sanity/ui'
import {TrashIcon} from '@sanity/icons'
import {API_VERSION, SCHEMA_TYPE, RETENTION_DAYS} from '../constants'
import {collectReferenceIds, getDocumentTitle} from '../utils/references'
import type {RecycleBinPluginConfig, DeletedByUser} from '../types'

interface CreateDeleteWithArchiveOptions {
  config: RecycleBinPluginConfig
}

export function createDeleteWithArchiveAction(
  originalDeleteAction: DocumentActionComponent,
  options: CreateDeleteWithArchiveOptions,
): DocumentActionComponent {
  const {config} = options
  const retentionDays = config.retentionDays ?? RETENTION_DAYS

  const DeleteWithArchiveAction: DocumentActionComponent = (props: DocumentActionProps) => {
    const {id, type, draft, published, onComplete} = props
    const client = useClient({apiVersion: API_VERSION})
    const user = useCurrentUser()
    const toast = useToast()
    const {delete: deleteOp} = useDocumentOperation(id, type)

    const [showDialog, setShowDialog] = useState(false)
    const [isArchiving, setIsArchiving] = useState(false)

    // Get the original action to preserve its properties
    const originalAction = originalDeleteAction(props)

    // Get the document to archive (draft or published)
    const documentToArchive = draft || published

    // Check if this type should use recycle bin
    const shouldUseRecycleBin = useMemo(() => {
      // Skip if document doesn't exist
      if (!documentToArchive) return false

      // Check excludeTypes
      if (config.excludeTypes?.includes(type)) return false

      // Check deletableTypes (if specified, must be in the list)
      if (config.deletableTypes && !config.deletableTypes.includes(type)) return false

      return true
    }, [type, documentToArchive])

    // If this type shouldn't use recycle bin, return original action
    if (!shouldUseRecycleBin) {
      return originalAction
    }

    const handleArchiveAndDelete = useCallback(async () => {
      if (!documentToArchive) return

      setIsArchiving(true)

      try {
        // Collect all reference IDs from the document
        const referencedIds = new Set<string>()
        collectReferenceIds(documentToArchive, referencedIds)

        // Calculate expiration date
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setDate(expiresAt.getDate() + retentionDays)

        // Get user info for deletedBy
        const deletedBy: DeletedByUser = {
          id: user?.id || 'unknown',
          name: user?.name || 'Unknown User',
          email: user?.email,
        }

        // Create the archive document
        const archiveDoc = {
          _type: SCHEMA_TYPE,
          originalDocumentId: id,
          originalType: type,
          deletedAt: now.toISOString(),
          deletedBy,
          expiresAt: expiresAt.toISOString(),
          documentTitle: getDocumentTitle(documentToArchive as Record<string, unknown>),
          documentSnapshot: JSON.stringify(documentToArchive),
          referencedDocumentIds: Array.from(referencedIds),
        }

        // Create archive first
        await client.create(archiveDoc)

        // Then delete the original document
        deleteOp.execute()

        toast.push({
          status: 'success',
          title: 'Document moved to Recycle Bin',
          description: `Will be permanently deleted in ${retentionDays} days`,
        })

        setShowDialog(false)
        onComplete()
      } catch (err) {
        console.error('Failed to archive document:', err)
        toast.push({
          status: 'error',
          title: 'Failed to move to Recycle Bin',
          description: err instanceof Error ? err.message : 'An error occurred',
        })
      } finally {
        setIsArchiving(false)
      }
    }, [documentToArchive, id, type, user, client, deleteOp, toast, onComplete, retentionDays])

    const handleOpen = useCallback(() => {
      setShowDialog(true)
    }, [])

    const handleClose = useCallback(() => {
      setShowDialog(false)
    }, [])

    // Calculate expiration date for display
    const expirationDate = useMemo(() => {
      const date = new Date()
      date.setDate(date.getDate() + retentionDays)
      return date.toLocaleDateString()
    }, [retentionDays])

    // Handle case where original action is null
    if (!originalAction) {
      return null
    }

    const result: DocumentActionDescription = {
      ...originalAction,
      onHandle: handleOpen,
      dialog: showDialog
        ? {
            type: 'dialog',
            onClose: handleClose,
            content: (
              <Dialog
                id="recycle-bin-confirm-dialog"
                header="Move to Recycle Bin"
                onClose={handleClose}
                width={1}
              >
                <Box padding={4}>
                  <Stack space={4}>
                    <Card padding={3} radius={2} tone="caution">
                      <Stack space={3}>
                        <Text size={2} weight="semibold">
                          This document will be moved to the Recycle Bin
                        </Text>
                        <Text size={1} muted>
                          You can restore it from the Recycle Bin tool within {retentionDays} days
                          (until {expirationDate}).
                        </Text>
                        <Text size={1} muted>
                          After this period, it will be permanently deleted.
                        </Text>
                      </Stack>
                    </Card>
                    <Flex gap={3} justify="flex-end">
                      <Button
                        mode="ghost"
                        text="Cancel"
                        onClick={handleClose}
                        disabled={isArchiving}
                      />
                      <Button
                        tone="critical"
                        icon={TrashIcon}
                        text={isArchiving ? 'Moving...' : 'Move to Recycle Bin'}
                        onClick={handleArchiveAndDelete}
                        disabled={isArchiving}
                      />
                    </Flex>
                  </Stack>
                </Box>
              </Dialog>
            ),
          }
        : originalAction.dialog,
    }

    return result
  }

  return DeleteWithArchiveAction
}

export function wrapDeleteWithArchive(
  prev: DocumentActionComponent[],
  schemaType: string,
  config: RecycleBinPluginConfig,
): DocumentActionComponent[] {
  return prev.map((action) =>
    action.action === 'delete' ? createDeleteWithArchiveAction(action, {config}) : action,
  )
}
