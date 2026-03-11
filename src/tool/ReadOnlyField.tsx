import {Card, Stack, Text, TextInput, Switch, Code, Flex, Label} from '@sanity/ui'
import {
  isStringSchemaType,
  isNumberSchemaType,
  isBooleanSchemaType,
  isReferenceSchemaType,
  isImageSchemaType,
  isFileSchemaType,
  isArraySchemaType,
  isObjectSchemaType,
  isBlockSchemaType,
  type SchemaType,
} from 'sanity'

interface ReadOnlyFieldProps {
  fieldType: SchemaType
  value: unknown
  depth?: number
}

function getBaseTypeName(type: SchemaType): string {
  let current: SchemaType | undefined = type
  while (current) {
    if (!current.type) return current.name
    current = current.type as SchemaType | undefined
  }
  return type.name
}

function PortableTextPreview({value}: {value: unknown[]}) {
  const text = value
    .map((block: unknown) => {
      if (typeof block !== 'object' || block === null) return ''
      const b = block as Record<string, unknown>
      if (!Array.isArray(b.children)) return ''
      return (b.children as unknown[])
        .map((span: unknown) => {
          if (typeof span !== 'object' || span === null) return ''
          return (span as Record<string, unknown>).text ?? ''
        })
        .join('')
    })
    .filter(Boolean)
    .join('\n')

  return (
    <Card padding={2} radius={2} tone="transparent" border>
      <Text size={1} style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit'}}>
        {text || <em>(empty)</em>}
      </Text>
    </Card>
  )
}

function FieldLabel({title, name}: {title?: string; name: string}) {
  return (
    <Label size={1} muted>
      {title || name}
    </Label>
  )
}

export function ReadOnlyField({fieldType, value, depth = 0}: ReadOnlyFieldProps) {
  if (value === null || value === undefined) return null

  if (depth >= 5) {
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <Code language="json" size={1}>
          {JSON.stringify(value, null, 2)}
        </Code>
      </Stack>
    )
  }

  // Block (portable text) — check before array/object
  if (isBlockSchemaType(fieldType)) {
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <PortableTextPreview value={[value]} />
      </Stack>
    )
  }

  // Image — check before generic object
  if (isImageSchemaType(fieldType)) {
    const v = value as Record<string, unknown>
    const ref = (v.asset as Record<string, unknown> | undefined)?._ref as string | undefined
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <Card padding={2} radius={2} tone="transparent" border>
          <Text size={1} style={{fontFamily: 'monospace'}}>
            {ref ?? JSON.stringify(value)}
          </Text>
        </Card>
      </Stack>
    )
  }

  // File — check before generic object
  if (isFileSchemaType(fieldType)) {
    const v = value as Record<string, unknown>
    const ref = (v.asset as Record<string, unknown> | undefined)?._ref as string | undefined
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <Card padding={2} radius={2} tone="transparent" border>
          <Text size={1} style={{fontFamily: 'monospace'}}>
            {ref ?? JSON.stringify(value)}
          </Text>
        </Card>
      </Stack>
    )
  }

  // Reference — check before generic object
  if (isReferenceSchemaType(fieldType)) {
    const ref = (value as Record<string, unknown>)._ref as string | undefined
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <Card padding={2} radius={2} tone="transparent" border>
          <Text size={1} style={{fontFamily: 'monospace'}}>
            {ref ?? String(value)}
          </Text>
        </Card>
      </Stack>
    )
  }

  // Array
  if (isArraySchemaType(fieldType)) {
    const arr = value as unknown[]
    // Detect block array (portable text)
    const isBlockArray =
      arr.length > 0 &&
      typeof arr[0] === 'object' &&
      arr[0] !== null &&
      (arr[0] as Record<string, unknown>)._type === 'block'

    if (isBlockArray) {
      return (
        <Stack space={2}>
          <FieldLabel title={fieldType.title} name={fieldType.name} />
          <PortableTextPreview value={arr} />
        </Stack>
      )
    }

    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <Card padding={2} radius={2} tone="transparent" border>
          <Stack space={3}>
            {arr.map((item, i) => {
              const itemType =
                fieldType.of.length === 1
                  ? fieldType.of[0]
                  : (fieldType.of.find(
                      (t) => (item as Record<string, unknown>)?._type === t.name,
                    ) ?? fieldType.of[0])
              return <ReadOnlyField key={i} fieldType={itemType} value={item} depth={depth + 1} />
            })}
          </Stack>
        </Card>
      </Stack>
    )
  }

  // Object
  if (isObjectSchemaType(fieldType)) {
    const obj = value as Record<string, unknown>
    const fields = fieldType.fields ?? []
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <Card padding={3} radius={2} tone="transparent" border>
          <Stack space={3}>
            {fields.map((field) => (
              <ReadOnlyField
                key={field.name}
                fieldType={field.type}
                value={obj[field.name]}
                depth={depth + 1}
              />
            ))}
          </Stack>
        </Card>
      </Stack>
    )
  }

  // Boolean
  if (isBooleanSchemaType(fieldType)) {
    return (
      <Flex align="center" gap={3}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <Switch checked={Boolean(value)} disabled />
      </Flex>
    )
  }

  // Number
  if (isNumberSchemaType(fieldType)) {
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <TextInput value={String(value)} readOnly />
      </Stack>
    )
  }

  // String (and date/datetime/slug via base type name)
  if (isStringSchemaType(fieldType)) {
    const baseName = getBaseTypeName(fieldType)
    let display = String(value)
    if (baseName === 'date') {
      display = new Date(display).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else if (baseName === 'datetime') {
      display = new Date(display).toLocaleString()
    } else if (baseName === 'slug') {
      display = ((value as Record<string, unknown>).current as string) ?? display
    }
    return (
      <Stack space={2}>
        <FieldLabel title={fieldType.title} name={fieldType.name} />
        <TextInput value={display} readOnly />
      </Stack>
    )
  }

  // Fallback
  return (
    <Stack space={2}>
      <FieldLabel title={fieldType.title} name={fieldType.name} />
      <Code language="json" size={1}>
        {JSON.stringify(value, null, 2)}
      </Code>
    </Stack>
  )
}
