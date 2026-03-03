/**
 * Recursively collects all reference IDs from an object
 */
export function collectReferenceIds(obj: unknown, refs: Set<string>): void {
  if (!obj || typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectReferenceIds(item, refs)
    }
    return
  }

  const record = obj as Record<string, unknown>

  // Check if this is a reference object
  if (record._type === 'reference' && typeof record._ref === 'string') {
    refs.add(record._ref)
    return
  }

  // Recursively check all properties
  for (const key of Object.keys(record)) {
    collectReferenceIds(record[key], refs)
  }
}

/**
 * Nullifies missing references in a document by setting _ref to undefined
 * Returns the IDs of references that were nullified
 */
export function nullifyMissingRefs(
  obj: unknown,
  missingIds: Set<string>,
  nullifiedIds: string[] = [],
): string[] {
  if (!obj || typeof obj !== 'object') return nullifiedIds

  if (Array.isArray(obj)) {
    // Process array items in reverse to safely remove while iterating
    for (let i = obj.length - 1; i >= 0; i--) {
      const item = obj[i] as Record<string, unknown>
      if (item?._type === 'reference' && typeof item._ref === 'string') {
        if (missingIds.has(item._ref)) {
          nullifiedIds.push(item._ref)
          obj.splice(i, 1) // Remove the reference from array
        }
      } else {
        nullifyMissingRefs(item, missingIds, nullifiedIds)
      }
    }
    return nullifiedIds
  }

  const record = obj as Record<string, unknown>

  // Process object properties
  for (const key of Object.keys(record)) {
    const value = record[key] as Record<string, unknown>
    if (value?._type === 'reference' && typeof value._ref === 'string') {
      if (missingIds.has(value._ref)) {
        nullifiedIds.push(value._ref)
        delete record[key] // Remove the reference property
      }
    } else {
      nullifyMissingRefs(value, missingIds, nullifiedIds)
    }
  }

  return nullifiedIds
}

/**
 * Gets the display title from a document
 */
export function getDocumentTitle(doc: Record<string, unknown>): string {
  // Try common title fields
  if (typeof doc.title === 'string' && doc.title) return doc.title
  if (typeof doc.name === 'string' && doc.name) return doc.name

  // Try nested title in internalTitle or seo
  const internalTitle = doc.internalTitle as Record<string, unknown> | undefined
  if (typeof internalTitle?.title === 'string' && internalTitle.title) {
    return internalTitle.title
  }

  const seo = doc.seo as Record<string, unknown> | undefined
  if (typeof seo?.title === 'string' && seo.title) {
    return seo.title
  }

  // Try slug
  const slug = doc.slug as Record<string, unknown> | undefined
  if (typeof slug?.current === 'string' && slug.current) {
    return slug.current
  }

  return 'Untitled'
}
