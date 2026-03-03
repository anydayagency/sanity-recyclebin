import { defineType, defineField } from 'sanity';
import { TrashIcon } from '@sanity/icons';
import { SCHEMA_TYPE } from '../constants';

export const deletedDocumentSchema = defineType({
  name: SCHEMA_TYPE,
  title: 'Deleted Document',
  type: 'document',
  icon: TrashIcon,
  fields: [
    defineField({
      name: 'originalDocumentId',
      title: 'Original Document ID',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'originalType',
      title: 'Original Type',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'siteId',
      title: 'Site ID',
      type: 'string',
      description: 'Workspace site ID for multi-site filtering',
      readOnly: true,
    }),
    defineField({
      name: 'deletedAt',
      title: 'Deleted At',
      type: 'datetime',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'deletedBy',
      title: 'Deleted By',
      type: 'object',
      fields: [
        defineField({
          name: 'id',
          title: 'User ID',
          type: 'string',
        }),
        defineField({
          name: 'name',
          title: 'Name',
          type: 'string',
        }),
        defineField({
          name: 'email',
          title: 'Email',
          type: 'string',
        }),
      ],
      readOnly: true,
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      description: 'Document will be permanently deleted after this date',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'documentTitle',
      title: 'Document Title',
      type: 'string',
      description: 'Cached title for display in recycle bin',
      readOnly: true,
    }),
    defineField({
      name: 'documentSnapshot',
      title: 'Document Snapshot',
      type: 'text',
      description: 'JSON-stringified complete document data at time of deletion',
      readOnly: true,
    }),
    defineField({
      name: 'referencedDocumentIds',
      title: 'Referenced Document IDs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'IDs of documents referenced by this document for restore validation',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'documentTitle',
      originalType: 'originalType',
      deletedAt: 'deletedAt',
      siteId: 'siteId',
    },
    prepare({ title, originalType, deletedAt, siteId }) {
      const date = deletedAt ? new Date(deletedAt).toLocaleDateString() : 'Unknown';
      return {
        title: title || 'Untitled',
        subtitle: `${originalType} • Deleted ${date}${siteId ? ` • ${siteId}` : ''}`,
        media: TrashIcon,
      };
    },
  },
});
