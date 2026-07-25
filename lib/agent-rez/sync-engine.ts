/**
 * Agent Rez: Hydration & State Synchronization Module (Rez-Sync)
 * Handles atomic transaction writes and state locking with Supabase
 * to prevent client hydration shifts and schema desynchronization.
 * 
 * Uses the save_resume RPC to enforce RLS, rate limiting, and active resume limits
 * instead of bypassing them with direct upserts.
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
   * Upserts the document session state atomically via the save_resume RPC.
   * This enforces RLS, rate limiting (leaky bucket), and the 3-active-resume cap
   * that a direct .from('resumes').upsert() would bypass.
   */
  public static async synchronizeSession(
    payload: SynchronizationPayload
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const { userId, documentId, semanticContent, layoutConfig, gazeScores } = payload;

    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client instance unavailable.' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'No active session. User must be authenticated.' };
      }

      // Merge design config into the content payload to match save_resume RPC expectations
      const contentPayload = {
        ...semanticContent,
        design: layoutConfig,
        ...(gazeScores ? { gazeScores } : {}),
      };

      const { data, error } = await supabase.rpc('save_resume', {
        p_id: documentId || null,
        p_content: contentPayload,
      });

      if (error) {
        console.warn('[Rez-Sync] save_resume RPC error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, id: data };
    } catch (err: any) {
      console.error('[Rez-Sync] Transaction failed:', err);
      return { success: false, error: err?.message || 'Unknown synchronization error' };
    }
  }
}
