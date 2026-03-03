import {useCallback, useState} from 'react'
import {useClient} from 'sanity'
import {Dialog, Box, Card, Stack, Text, Button, Flex} from '@sanity/ui'
import {TrashIcon, WarningOutlineIcon} from '@sanity/icons'
import {API_VERSION} from '../constants'
import type {DeletedDocument} from '../types'

interface PurgeDialogProps {
  document: DeletedDocument
  onClose: () => void
  onPurged: () => void
}

export function PurgeDialog({document, onClose, onPurged}: PurgeDialogProps) {
  const client = useClient({apiVersion: API_VERSION})
  const [purging, setPurging] = useState(false)

  const handlePurge = useCallback(async () => {
    setPurging(true)

    try {
      await client.delete(document._id)
      onPurged()
    } catch (err) {
      console.error('Failed to permanently delete document:', err)
    } finally {
      setPurging(false)
    }
  }, [client, document._id, onPurged])

  return (
    <Dialog id="purge-document-dialog" header="Permanently Delete" onClose={onClose} width={1}>
      <Box padding={4}>
        <Stack space={4}>
          <Card padding={3} radius={2} tone="critical">
            <Stack space={3}>
              <Flex align="center" gap={2}>
                <Text size={2}>
                  <WarningOutlineIcon />
                </Text>
                <Text size={2} weight="semibold">
                  This action cannot be undone
                </Text>
              </Flex>
              <Text size={1}>
                Are you sure you want to permanently delete "{document.documentTitle}"?
              </Text>
              <Text size={1} muted>
                This will remove the document from the Recycle Bin and it cannot be recovered.
              </Text>
            </Stack>
          </Card>

          <Flex gap={3} justify="flex-end">
            <Button mode="ghost" text="Cancel" onClick={onClose} disabled={purging} />
            <Button
              tone="critical"
              icon={TrashIcon}
              text={purging ? 'Deleting...' : 'Permanently Delete'}
              onClick={handlePurge}
              disabled={purging}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
