/**
 * Agent Rez: Hydration & State Synchronization Module (Rez-Sync)
 * Handles atomic transaction writes and state locking with Supabase
 * to prevent client hydration shifts and schema desynchronization.
 */

import { supabase } from '../supabase';

export interface SynchronizationPayload {
  userId: string;
  documentId: string;
  semanticContent: Record<string, any>;
  layoutConfig: Record<string, any>;
  gazeScores?: Record<string, any>;
}

export class HydrationSynchronizer {
  /**
   * Upserts the document session state atomically into Supabase database storage.
   */
  public static async synchronizeSession(
    payload: SynchronizationPayload
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const { userId, documentId, semanticContent, layoutConfig, gazeScores } = payload;

    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client instance unavailable.' };
      }

      const { data, error } = await supabase
        .from('resumes')
        .upsert(
          {
            id: documentId,
            user_id: userId,
            content: semanticContent,
            design: layoutConfig,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id')
        .single();

      if (error) {
        console.warn('[Rez-Sync] Supabase upsert error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (err: any) {
      console.error('[Rez-Sync] Transaction failed:', err);
      return { success: false, error: err?.message || 'Unknown synchronization error' };
    }
  }
}
