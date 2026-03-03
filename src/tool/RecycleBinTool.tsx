import {useState, useCallback} from 'react'
import {Box, Stack, Text, Flex, Badge, Heading, useToast} from '@sanity/ui'
import {TrashIcon} from '@sanity/icons'
import {useDeletedDocuments} from '../hooks/useDeletedDocuments'
import {useAutoPurge} from '../hooks/useAutoPurge'
import {DocumentList} from './DocumentList'
import {RestoreDialog} from './RestoreDialog'
import {PurgeDialog} from './PurgeDialog'
import {DeletedDocumentView} from './DeletedDocumentView'
import type {DeletedDocument} from '../types'

export function RecycleBinTool() {
  const toast = useToast()
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<DeletedDocument | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)

  const {documents, loading, error, refresh} = useDeletedDocuments({
    typeFilter: typeFilter || undefined,
    searchQuery: searchQuery || undefined,
  })

  // Auto-purge expired documents on mount
  useAutoPurge({
    onPurged: (count) => {
      toast.push({
        status: 'info',
        title: 'Auto-purge complete',
        description: `${count} expired document(s) were permanently deleted`,
      })
      refresh()
    },
    onError: (err) => {
      console.error('Auto-purge error:', err)
    },
  })

  const handleSelect = useCallback((doc: DeletedDocument) => {
    setSelectedDocument(doc)
  }, [])

  const handleRestore = useCallback(() => {
    if (selectedDocument) {
      setShowRestoreDialog(true)
    }
  }, [selectedDocument])

  const handlePurge = useCallback(() => {
    if (selectedDocument) {
      setShowPurgeDialog(true)
    }
  }, [selectedDocument])

  const handleRestored = useCallback(() => {
    toast.push({
      status: 'success',
      title: 'Document restored',
      description: `"${selectedDocument?.documentTitle}" has been restored`,
    })
    setShowRestoreDialog(false)
    setSelectedDocument(null)
    refresh()
  }, [selectedDocument, toast, refresh])

  const handlePurged = useCallback(() => {
    toast.push({
      status: 'success',
      title: 'Document permanently deleted',
      description: `"${selectedDocument?.documentTitle}" has been removed from the Recycle Bin`,
    })
    setShowPurgeDialog(false)
    setSelectedDocument(null)
    refresh()
  }, [selectedDocument, toast, refresh])

  return (
    <Box padding={4} style={{height: '100%'}}>
      <Stack space={4} style={{height: '100%'}}>
        <Flex align="center" gap={3}>
          <Text size={3}>
            <TrashIcon />
          </Text>
          <Heading as="h1" size={2}>
            Recycle Bin
          </Heading>
          <Badge tone="default">{documents.length} items</Badge>
        </Flex>

        <Flex gap={4} style={{flex: 1, minHeight: 0}}>
          <Box style={{width: '400px', overflowY: 'auto'}}>
            <DocumentList
              documents={documents}
              loading={loading}
              error={error}
              selectedId={selectedDocument?._id || null}
              onSelect={handleSelect}
              onTypeFilterChange={setTypeFilter}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              searchQuery={searchQuery}
            />
          </Box>

          <Box style={{flex: 1, minHeight: 0}}>
            <DeletedDocumentView
              document={selectedDocument}
              onRestore={handleRestore}
              onPurge={handlePurge}
            />
          </Box>
        </Flex>
      </Stack>

      {showRestoreDialog && selectedDocument && (
        <RestoreDialog
          document={selectedDocument}
          onClose={() => setShowRestoreDialog(false)}
          onRestored={handleRestored}
        />
      )}

      {showPurgeDialog && selectedDocument && (
        <PurgeDialog
          document={selectedDocument}
          onClose={() => setShowPurgeDialog(false)}
          onPurged={handlePurged}
        />
      )}
    </Box>
  )
}
