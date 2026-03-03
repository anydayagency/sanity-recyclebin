import {Card, Stack, Text, Flex, Badge, Heading, Box} from '@sanity/ui'
import {DocumentIcon, TrashIcon, WarningOutlineIcon} from '@sanity/icons'
import {useSchema} from 'sanity'
import type {DeletedDocument} from '../types'
import {ReadOnlyField} from './ReadOnlyField'
import {DocumentActionBar} from './DocumentActionBar'

const SYSTEM_FIELDS = new Set(['_id', '_type', '_rev', '_createdAt', '_updatedAt'])

interface DeletedDocumentViewProps {
  document: DeletedDocument | null
  onRestore: () => void
  onPurge: () => void
}

export function DeletedDocumentView({document, onRestore, onPurge}: DeletedDocumentViewProps) {
  const schema = useSchema()

  if (!document) {
    return (
      <Card tone="transparent" style={{height: '100%'}}>
        <Flex align="center" justify="center" style={{height: '100%'}}>
          <Stack space={3} style={{textAlign: 'center'}}>
            <Text size={4} muted>
              <TrashIcon />
            </Text>
            <Text muted>Select a document to view details</Text>
          </Stack>
        </Flex>
      </Card>
    )
  }

  let snapshot: Record<string, unknown> | null = null
  let parseError = false
  try {
    snapshot = JSON.parse(document.documentSnapshot)
  } catch {
    parseError = true
  }

  const schemaType = schema.get(document.originalType)

  return (
    <Card style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Card padding={4} borderBottom>
        <Stack space={3}>
          <Flex align="center" gap={2}>
            <Text size={3}>
              <DocumentIcon />
            </Text>
            <Heading as="h2" size={1}>
              {document.documentTitle || 'Untitled'}
            </Heading>
          </Flex>
          <Flex gap={2}>
            <Badge mode="outline">{document.originalType}</Badge>
          </Flex>
        </Stack>
      </Card>

      {/* Scrollable fields */}
      <Box style={{flex: 1, overflowY: 'auto'}} padding={4}>
        {parseError && (
          <Card tone="critical" padding={3} radius={2} marginBottom={4}>
            <Flex gap={2} align="center">
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Text size={1}>Could not parse document snapshot. The stored JSON is invalid.</Text>
            </Flex>
          </Card>
        )}

        {!parseError && !schemaType && (
          <Card tone="caution" padding={3} radius={2} marginBottom={4}>
            <Flex gap={2} align="center">
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
              <Text size={1}>
                Schema type <strong>{document.originalType}</strong> is not registered. Showing raw
                snapshot.
              </Text>
            </Flex>
          </Card>
        )}

        {parseError && snapshot === null ? null : !schemaType || parseError ? (
          <Card padding={3} radius={2} tone="transparent" border>
            <pre style={{margin: 0, fontSize: '12px', overflowX: 'auto'}}>
              {JSON.stringify(snapshot ?? {}, null, 2)}
            </pre>
          </Card>
        ) : (
          <Stack space={5}>
            {(schemaType.fields ?? [])
              .filter((field) => !SYSTEM_FIELDS.has(field.name))
              .map((field) => (
                <ReadOnlyField
                  key={field.name}
                  fieldType={field.type}
                  value={(snapshot as Record<string, unknown>)[field.name]}
                  depth={0}
                />
              ))}
          </Stack>
        )}
      </Box>

      {/* Action bar */}
      <DocumentActionBar document={document} onRestore={onRestore} onPurge={onPurge} />
    </Card>
  )
}
