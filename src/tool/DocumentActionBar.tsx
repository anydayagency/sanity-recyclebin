import {Card, Flex, Text, Button} from '@sanity/ui'
import {RestoreIcon, TrashIcon} from '@sanity/icons'
import type {DeletedDocument} from '../types'

interface DocumentActionBarProps {
  document: DeletedDocument
  onRestore: () => void
  onPurge: () => void
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DocumentActionBar({document, onRestore, onPurge}: DocumentActionBarProps) {
  return (
    <Card scheme="dark" borderTop padding={3}>
      <Flex align="center" justify="space-between" gap={3}>
        <Text size={1} muted>
          Deleted {formatDate(document.deletedAt)}
          {document.deletedBy?.name ? ` · by ${document.deletedBy.name}` : ''}
        </Text>
        <Flex gap={2}>
          <Button tone="positive" icon={RestoreIcon} text="Restore" onClick={onRestore} />
          <Button
            tone="critical"
            mode="ghost"
            icon={TrashIcon}
            text="Delete Permanently"
            onClick={onPurge}
          />
        </Flex>
      </Flex>
    </Card>
  )
}
