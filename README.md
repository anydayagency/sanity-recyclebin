# Sanity Plugin Recyle bin

A Sanity plugin that provides soft-delete functionality with configurable retention, allowing users to restore deleted documents from a Recycle Bin tool.

## Features

- **Soft delete** - Documents are moved to Recycle Bin instead of being permanently deleted
- **Configurable retention** - Default 30-day retention period before auto-purge
- **Document restoration** - Restore deleted documents with missing reference handling
- **Multi-site support** - Filter by workspace/siteId in admin workspace
- **Auto-purge** - Expired documents are automatically removed

## Installation

```bash
npm install sanity-plugin-recycle-bin
```

## Usage

Add the plugin to your Sanity configuration:

```typescript
import {defineConfig} from 'sanity'
import {recycleBin} from 'sanity-plugin-recycle-bin'

export default defineConfig({
  // ... your config
  plugins: [
    recycleBin({
      retentionDays: 30, // optional, default is 30
      deletableTypes: ['page', 'post', 'article'], // optional, limit to specific types
      excludeTypes: ['siteSettings', 'themeSettings'], // optional, exclude specific types
    }),
  ],
})
```

## Configuration Options

| Option           | Type       | Default     | Description                           |
| ---------------- | ---------- | ----------- | ------------------------------------- |
| `retentionDays`  | `number`   | `30`        | Days to retain deleted documents      |
| `deletableTypes` | `string[]` | `undefined` | Only these types will use soft delete |
| `excludeTypes`   | `string[]` | `undefined` | These types will use hard delete      |

## How It Works

1. When a document is deleted, it's archived as a `recycleBin.deletedDocument`
2. The archive stores the complete document snapshot and metadata
3. Users can restore documents from the Recycle Bin tool
4. When restoring, missing references are detected and nullified
5. Documents are auto-purged after the retention period expires

## Multi-Site Support

In a multi-site setup, the plugin respects the `siteId` field:

- **Regular workspaces** - Only see deleted documents for their site
- **Admin workspace** - Sees all deleted documents across all sites

## License

MIT
