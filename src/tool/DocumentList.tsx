import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  Stack,
  Text,
  TextInput,
  Select,
  Flex,
  Spinner,
  Badge,
} from '@sanity/ui';
import { SearchIcon, TrashIcon } from '@sanity/icons';
import { useWorkspace } from 'sanity';
import type { DeletedDocument } from '../types';

interface DocumentListProps {
  documents: DeletedDocument[];
  loading: boolean;
  error: Error | null;
  selectedId: string | null;
  onSelect: (doc: DeletedDocument) => void;
  onTypeFilterChange: (type: string) => void;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  searchQuery: string;
}

export function DocumentList({
  documents,
  loading,
  error,
  selectedId,
  onSelect,
  onTypeFilterChange,
  onSearchChange,
  typeFilter,
  searchQuery,
}: DocumentListProps) {
  const workspace = useWorkspace();
  const isAdminWorkspace = workspace?.name === 'admin';

  // Get unique types for filter dropdown
  const uniqueTypes = Array.from(new Set(documents.map((doc) => doc.originalType))).sort();

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange]
  );

  const handleTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onTypeFilterChange(event.target.value);
    },
    [onTypeFilterChange]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
    <Stack space={3}>
      {/* Filters */}
      <Card padding={3} radius={2} shadow={1}>
        <Stack space={3}>
          <TextInput
            icon={SearchIcon}
            placeholder="Search by title..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Flex gap={2}>
            <Box flex={1}>
              <Select value={typeFilter} onChange={handleTypeChange}>
                <option value="">All types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Box>
          </Flex>
        </Stack>
      </Card>

      {/* Document List */}
      {loading ? (
        <Card padding={4}>
          <Flex align="center" justify="center" gap={3}>
            <Spinner />
            <Text muted>Loading deleted documents...</Text>
          </Flex>
        </Card>
      ) : error ? (
        <Card padding={4} tone="critical">
          <Text>Error: {error.message}</Text>
        </Card>
      ) : documents.length === 0 ? (
        <Card padding={4}>
          <Stack space={3} style={{ textAlign: 'center' }}>
            <Text size={4}>
              <TrashIcon />
            </Text>
            <Text muted>Recycle Bin is empty</Text>
            <Text size={1} muted>
              Deleted documents will appear here
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack space={2}>
          {documents.map((doc) => {
            const daysRemaining = getDaysRemaining(doc.expiresAt);
            const isSelected = selectedId === doc._id;

            return (
              <Card
                key={doc._id}
                padding={3}
                radius={2}
                shadow={1}
                tone={isSelected ? 'primary' : undefined}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(doc)}
              >
                <Stack space={2}>
                  <Flex align="center" gap={2}>
                    <Text size={1} weight="semibold" style={{ flex: 1 }}>
                      {doc.documentTitle || 'Untitled'}
                    </Text>
                    <Badge tone={daysRemaining <= 7 ? 'critical' : 'caution'} fontSize={0}>
                      {daysRemaining}d left
                    </Badge>
                  </Flex>
                  <Flex gap={2} wrap="wrap">
                    <Badge mode="outline" fontSize={0}>
                      {doc.originalType}
                    </Badge>
                    {isAdminWorkspace && doc.siteId && (
                      <Badge tone="primary" fontSize={0}>
                        {doc.siteId}
                      </Badge>
                    )}
                    <Text size={0} muted>
                      Deleted {formatDate(doc.deletedAt)}
                    </Text>
                  </Flex>
                  {doc.deletedBy?.name && (
                    <Text size={0} muted>
                      by {doc.deletedBy.name}
                    </Text>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
