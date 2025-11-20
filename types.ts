
export enum EntityType {
  ACTION = 'Action',
  OBJECT = 'Object',
  PEOPLE = 'People',
  LOCATION = 'Location',
  TIME = 'Time',
  OTHER = 'Other'
}

export interface MetaTags {
  [EntityType.ACTION]?: string[];
  [EntityType.OBJECT]?: string[];
  [EntityType.PEOPLE]?: string[];
  [EntityType.LOCATION]?: string[];
  [EntityType.TIME]?: string[];
}

export interface Memory {
  id: string;
  rawContent: string;
  processedContent: string; // Cleaned up text (e.g. from speech)
  timestamp: number; // Unix timestamp
  tags: MetaTags;
  status?: 'pending' | 'processed'; // New field
}

// Search/Retrieval Types

export interface ClusterItem {
  memoryId: string;
  snippet: string;
  relevance: string;
}

export interface ResultCluster {
  dimension: EntityType | string;
  title: string;
  items: ClusterItem[];
}

export interface SearchResult {
  directAnswer?: string;
  clusters: ResultCluster[];
}

export interface Suggestion {
  label: string;
  query: string;
  icon: string;
}
