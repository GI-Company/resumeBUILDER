'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Zap } from 'lucide-react';

interface ActivityEvent {
  id: string;
  display_message: string;
  created_at: string;
}

export default function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // Wait for real events from Supabase Realtime

    const channel = supabase
      .channel('public_activity_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'public_activity_feed',
        },
        (payload) => {
          const newEvent = payload.new as ActivityEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 5)); // Keep last 5
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl p-3 shadow-sm overflow-hidden h-14 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 bg-white/90 pr-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live</span>
        </div>
        
        <div className="pl-16 h-full flex items-center relative">
          <AnimatePresence mode="popLayout">
            {events.slice(0, 1).map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute text-xs sm:text-sm font-medium text-gray-700 truncate w-full pr-4"
              >
                {ev.display_message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
