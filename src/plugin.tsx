import { definePlugin } from 'sanity';
import { TrashIcon } from '@sanity/icons';
import { deletedDocumentSchema } from './schemas/deletedDocument';
import { wrapDeleteWithArchive } from './actions/deleteWithArchive';
import { RecycleBinTool } from './tool/RecycleBinTool';
import type { RecycleBinPluginConfig } from './types';
import { RETENTION_DAYS } from './constants';

export const recycleBin = definePlugin<RecycleBinPluginConfig | void>((config = {}) => {
  const pluginConfig: RecycleBinPluginConfig = {
    retentionDays: RETENTION_DAYS,
    ...config,
  };

  return {
    name: 'sanity-plugin-recycle-bin',
    schema: {
      types: [deletedDocumentSchema],
    },
    document: {
      actions: (prev, context) => {
        return wrapDeleteWithArchive(prev, context.schemaType, pluginConfig);
      },
    },
    tools: [
      {
        name: 'recycle-bin',
        title: 'Recycle Bin',
        icon: TrashIcon,
        component: RecycleBinTool,
      },
    ],
  };
});
