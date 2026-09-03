export type MatchLogic = 'and' | 'or'

export type FieldType = 'string' | 'tag' | 'status' | 'number' | 'date' | 'list'

export interface SegmentCondition {
  id: string
  field: string
  operator: string
  value: string
  fieldType: FieldType
}

export interface DynamicSegment {
  id: string
  name: string
  description: string
  matchLogic: MatchLogic
  conditions: SegmentCondition[]
  contactCount: number
  createdAt: string
  updatedAt: string
}
