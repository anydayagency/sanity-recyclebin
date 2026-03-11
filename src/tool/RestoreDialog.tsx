import {useCallback, useEffect, useState} from 'react'
import {Dialog, Box, Card, Stack, Text, Button, Flex, Spinner} from '@sanity/ui'
import {RestoreIcon, WarningOutlineIcon} from '@sanity/icons'
import {useRestoreDocument} from '../hooks/useRestoreDocument'
import type {DeletedDocument, ReferenceCheckResult} from '../types'

interface RestoreDialogProps {
  document: DeletedDocument
  onClose: () => void
  onRestored: () => void
}

export function RestoreDialog({document, onClose, onRestored}: RestoreDialogProps) {
  const {restore, checkReferences, restoring} = useRestoreDocument()
  const [referenceCheck, setReferenceCheck] = useState<ReferenceCheckResult | null>(null)
  const [checkingRefs, setCheckingRefs] = useState(true)

  useEffect(() => {
    async function check() {
      setCheckingRefs(true)
      const result = await checkReferences(document)
      setReferenceCheck(result)
      setCheckingRefs(false)
    }
    check()
  }, [document, checkReferences])

  const handleRestore = useCallback(async () => {
    const result = await restore(document)

    if (result.success) {
      onRestored()
    }
  }, [document, restore, onRestored])

  const hasMissingRefs = referenceCheck && referenceCheck.missingIds.length > 0

  return (
    <Dialog id="restore-document-dialog" header="Restore Document" onClose={onClose} width={1}>
      <Box padding={4}>
        <Stack space={4}>
          {checkingRefs ? (
            <Flex align="center" justify="center" gap={3} padding={4}>
              <Spinner />
              <Text>Checking document references...</Text>
            </Flex>
          ) : (
            <>
              <Card padding={3} radius={2} tone="positive">
                <Stack space={4}>
                  <Text size={2} weight="semibold">
                    Restore "{document.documentTitle}"?
                  </Text>
                  <Text size={1} muted>
                    This will restore the document to its original location with type "
                    {document.originalType}".
                  </Text>
                </Stack>
              </Card>

              {hasMissingRefs && (
                <Card padding={3} radius={2} tone="caution">
                  <Stack space={3}>
                    <Flex align="center" gap={2}>
                      <Text size={2}>
                        <WarningOutlineIcon />
                      </Text>
                      <Text size={2} weight="semibold">
                        Missing References Detected
                      </Text>
                    </Flex>
                    <Text size={1}>
                      The following referenced documents no longer exist and will be removed from
                      this document:
                    </Text>
                    <Card padding={2} radius={2} tone="transparent">
                      <Stack space={2}>
                        {referenceCheck.missingIds.map((id) => (
                          <Text key={id} size={1} muted style={{fontFamily: 'monospace'}}>
                            • {id}
                          </Text>
                        ))}
                      </Stack>
                    </Card>
                    <Text size={1} muted>
                      You can continue with the restore, and these references will be automatically
                      removed.
                    </Text>
                  </Stack>
                </Card>
              )}

              <Flex gap={3} justify="flex-end">
                <Button mode="ghost" text="Cancel" onClick={onClose} disabled={restoring} />
                <Button
                  tone="positive"
                  icon={RestoreIcon}
                  text={restoring ? 'Restoring...' : 'Restore Document'}
                  onClick={handleRestore}
                  disabled={restoring}
                />
              </Flex>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
