import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Memory, SearchResult, EntityType } from '../types';

// Initialize Gemini Client
// NOTE: In a real production app, API keys should not be exposed on the client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for Parsing User Input (Capture)
const parseInputSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    processedContent: { type: Type.STRING, description: "The clean, transcribed or corrected text of what the user said/typed in Chinese." },
    tags: {
      type: Type.OBJECT,
      properties: {
        [EntityType.ACTION]: { type: Type.ARRAY, items: { type: Type.STRING } },
        [EntityType.OBJECT]: { type: Type.ARRAY, items: { type: Type.STRING } },
        [EntityType.PEOPLE]: { type: Type.ARRAY, items: { type: Type.STRING } },
        [EntityType.LOCATION]: { type: Type.ARRAY, items: { type: Type.STRING } },
        [EntityType.TIME]: { type: Type.ARRAY, items: { type: Type.STRING } },
      }
    }
  },
  required: ["processedContent", "tags"]
};

// Schema for Clustering Results (Retrieve)
const searchResultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    directAnswer: { type: Type.STRING, description: "A conversational answer to the user's query in Chinese (e.g. '你提到了 Nikki 两次...')." },
    clusters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: { type: Type.STRING, description: "The dimension used for grouping (People, Action, Time, Object). Keep this strictly in English for icon mapping." },
          title: { type: Type.STRING, description: "A display title for this group in Chinese (e.g., '关于 Nikki 的事')." },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                memoryId: { type: Type.STRING, description: "The ID of the memory." },
                snippet: { type: Type.STRING, description: "A relevant summary or snippet of the memory in Chinese." },
                relevance: { type: Type.STRING, description: "Why this is relevant (in Chinese)." }
              },
              required: ["memoryId", "snippet"]
            }
          }
        },
        required: ["dimension", "title", "items"]
      }
    }
  },
  required: ["clusters"]
};

/**
 * Analyzes input (Text or Audio) and extracts structured metadata.
 */
export const analyzeInput = async (
  input: string | { mimeType: string; data: string },
  contextDate: Date
): Promise<{ processedContent: string; tags: any }> => {
  
  const prompt = `
    Analyze the following user input (Flash Memory) in Chinese context.
    Current Date/Time context: ${contextDate.toISOString()}.
    
    1. Correct any likely speech-to-text errors if audio provided (Output must be Simplified Chinese).
    2. Extract metadata dimensions: Action, Object, People, Location, Time.
    3. Be concise.
  `;

  const parts = [];
  if (typeof input === 'string') {
    parts.push({ text: input });
  } else {
    parts.push({ inlineData: { mimeType: input.mimeType, data: input.data } });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: parseInputSchema
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  throw new Error("Failed to analyze input");
};

/**
 * Performs RAG-like search and clustering on local memories.
 */
export const semanticSearch = async (
  query: string,
  memories: Memory[]
): Promise<SearchResult> => {
  
  // Context Injection (Simulating Vector DB for small/medium datasets)
  // We strip strict JSON format to save tokens, just giving formatted text
  const memoryContext = memories.map(m => 
    `ID: ${m.id} | Date: ${new Date(m.timestamp).toLocaleDateString()} | Content: ${m.processedContent} | Tags: ${JSON.stringify(m.tags)}`
  ).join('\n');

  const prompt = `
    You are an intelligent memory retrieval engine.
    User Query: "${query}"
    
    Here is the database of memories:
    ---
    ${memoryContext}
    ---
    
    Task:
    1. Answer the user's question based on the memories in Chinese (Simplified).
    2. Group relevant memories into semantic clusters based on dimensions (People, Action, Object, Time, etc.).
    3. If the query is broad (e.g., "我做了什么?"), group by diversity. If specific (e.g., "Nikki"), group by aspects of that specific topic.
    4. The 'dimension' property MUST be one of: 'People', 'Action', 'Object', 'Time', 'Location', 'Other' (in English).
    5. The 'title', 'snippet', and 'relevance' MUST be in Chinese.
    6. Return JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Using Pro for better reasoning on grouping if needed, but Flash is fast.
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: searchResultSchema
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  throw new Error("Failed to perform search");
};

/**
 * Generates smart suggestions based on recent history.
 */
export const generateSuggestions = async (memories: Memory[]): Promise<string[]> => {
  if (memories.length === 0) return [
    "我最近买了什么？",
    "昨天我见了谁？",
    "显示我的待办事项"
  ];

  const recent = memories.slice(0, 10).map(m => m.processedContent).join('; ');
  
  const prompt = `
    Based on these recent user memories: "${recent}"
    Generate 3 natural language questions the user might ask to recall information.
    Output must be in Simplified Chinese.
    Return as a simple JSON array of strings.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  return [];
};