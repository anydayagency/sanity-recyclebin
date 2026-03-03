import { useState, useCallback } from 'react';
import { Box, Card, Stack, Text, Flex, Button, Badge, Heading, useToast } from '@sanity/ui';
import { TrashIcon, RestoreIcon, ClockIcon, DocumentIcon } from '@sanity/icons';
import { useDeletedDocuments } from '../hooks/useDeletedDocuments';
import { useAutoPurge } from '../hooks/useAutoPurge';
import { DocumentList } from './DocumentList';
import { RestoreDialog } from './RestoreDialog';
import { PurgeDialog } from './PurgeDialog';
import type { DeletedDocument } from '../types';

export function RecycleBinTool() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<DeletedDocument | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);

  const { documents, loading, error, refresh } = useDeletedDocuments({
    typeFilter: typeFilter || undefined,
    searchQuery: searchQuery || undefined,
  });

  // Auto-purge expired documents on mount
  useAutoPurge({
    onPurged: (count) => {
      toast.push({
        status: 'info',
        title: 'Auto-purge complete',
        description: `${count} expired document(s) were permanently deleted`,
      });
      refresh();
    },
    onError: (err) => {
      console.error('Auto-purge error:', err);
    },
  });

  const handleSelect = useCallback((doc: DeletedDocument) => {
    setSelectedDocument(doc);
  }, []);

  const handleRestore = useCallback(() => {
    if (selectedDocument) {
      setShowRestoreDialog(true);
    }
  }, [selectedDocument]);

  const handlePurge = useCallback(() => {
    if (selectedDocument) {
      setShowPurgeDialog(true);
    }
  }, [selectedDocument]);

  const handleRestored = useCallback(() => {
    toast.push({
      status: 'success',
      title: 'Document restored',
      description: `"${selectedDocument?.documentTitle}" has been restored`,
    });
    setShowRestoreDialog(false);
    setSelectedDocument(null);
    refresh();
  }, [selectedDocument, toast, refresh]);

  const handlePurged = useCallback(() => {
    toast.push({
      status: 'success',
      title: 'Document permanently deleted',
      description: `"${selectedDocument?.documentTitle}" has been removed from the Recycle Bin`,
    });
    setShowPurgeDialog(false);
    setSelectedDocument(null);
    refresh();
  }, [selectedDocument, toast, refresh]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <Box padding={4} style={{ height: '100%' }}>
      <Stack space={4} style={{ height: '100%' }}>
        {/* Header */}
        <Flex align="center" gap={3}>
          <Text size={3}>
            <TrashIcon />
          </Text>
          <Heading as="h1" size={2}>
            Recycle Bin
          </Heading>
          <Badge tone="default">{documents.length} items</Badge>
        </Flex>

        {/* Content */}
        <Flex gap={4} style={{ flex: 1, minHeight: 0 }}>
          {/* Document List */}
          <Box style={{ width: '400px', overflowY: 'auto' }}>
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

          {/* Preview Panel */}
          <Box style={{ flex: 1 }}>
            {selectedDocument ? (
              <Card padding={4} radius={2} shadow={1} style={{ height: '100%' }}>
                <Stack space={4}>
                  {/* Document Info */}
                  <Stack space={3}>
                    <Flex align="center" gap={2}>
                      <Text size={3}>
                        <DocumentIcon />
                      </Text>
                      <Heading as="h2" size={1}>
                        {selectedDocument.documentTitle || 'Untitled'}
                      </Heading>
                    </Flex>

                    <Flex gap={2} wrap="wrap">
                      <Badge mode="outline">{selectedDocument.originalType}</Badge>
                      {selectedDocument.siteId && (
                        <Badge tone="primary">{selectedDocument.siteId}</Badge>
                      )}
                    </Flex>
                  </Stack>

                  {/* Metadata */}
                  <Card padding={3} radius={2} tone="transparent">
                    <Stack space={3}>
                      <Flex align="center" gap={2}>
                        <Text size={1} muted>
                          Original ID:
                        </Text>
                        <Text size={1} style={{ fontFamily: 'monospace' }}>
                          {selectedDocument.originalDocumentId}
                        </Text>
                      </Flex>

                      <Flex align="center" gap={2}>
                        <Text size={1} muted>
                          Deleted:
                        </Text>
                        <Text size={1}>{formatDate(selectedDocument.deletedAt)}</Text>
                      </Flex>

                      {selectedDocument.deletedBy && (
                        <Flex align="center" gap={2}>
                          <Text size={1} muted>
                            Deleted by:
                          </Text>
                          <Text size={1}>
                            {selectedDocument.deletedBy.name}
                            {selectedDocument.deletedBy.email && (
                              <Text as="span" size={1} muted>
                                {' '}
                                ({selectedDocument.deletedBy.email})
                              </Text>
                            )}
                          </Text>
                        </Flex>
                      )}

                      <Flex align="center" gap={2}>
                        <Text size={1}>
                          <ClockIcon />
                        </Text>
                        <Text size={1}>
                          Expires in{' '}
                          <Text as="span" weight="semibold">
                            {getDaysRemaining(selectedDocument.expiresAt)} days
                          </Text>
                        </Text>
                        <Text size={0} muted>
                          ({formatDate(selectedDocument.expiresAt)})
                        </Text>
                      </Flex>

                      {selectedDocument.referencedDocumentIds?.length > 0 && (
                        <Flex align="center" gap={2}>
                          <Text size={1} muted>
                            References:
                          </Text>
                          <Text size={1}>{selectedDocument.referencedDocumentIds.length} documents</Text>
                        </Flex>
                      )}
                    </Stack>
                  </Card>

                  {/* Actions */}
                  <Flex gap={3}>
                    <Button
                      tone="positive"
                      icon={RestoreIcon}
                      text="Restore"
                      onClick={handleRestore}
                    />
                    <Button
                      tone="critical"
                      mode="ghost"
                      icon={TrashIcon}
                      text="Delete Permanently"
                      onClick={handlePurge}
                    />
                  </Flex>
                </Stack>
              </Card>
            ) : (
              <Card padding={4} radius={2} tone="transparent" style={{ height: '100%' }}>
                <Flex
                  align="center"
                  justify="center"
                  style={{ height: '100%' }}
                >
                  <Stack space={3} style={{ textAlign: 'center' }}>
                    <Text size={4} muted>
                      <TrashIcon />
                    </Text>
                    <Text muted>Select a document to view details</Text>
                  </Stack>
                </Flex>
              </Card>
            )}
          </Box>
        </Flex>
      </Stack>

      {/* Dialogs */}
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
  );
}
