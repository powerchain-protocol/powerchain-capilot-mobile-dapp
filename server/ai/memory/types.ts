export type AiMemoryKind = 'preference' | 'context' | 'decision' | 'summary';
export type AiMemoryRecord = { id: string; kind: AiMemoryKind; content: string; createdAt: Date; updatedAt: Date };

export interface AiMemoryProvider {
  getGrounding(input: { userId: string; conversationId?: string; limit?: number }): Promise<Array<{ kind: AiMemoryKind; content: string }>>;
}
