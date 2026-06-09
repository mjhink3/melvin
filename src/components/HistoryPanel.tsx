/**
 * HistoryPanel.tsx
 * Timeline of past conversations -- days, months, years.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { loadAllSummaries, bucketSummaries, HistoryBucket, SessionSummary } from '../historyService';

interface HistoryPanelProps {
  userId: string;
  refreshTrigger?: number;
}

function SessionCard({ session }: { session: SessionSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-l-2 border-stone-300 pl-2 py-0.5">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full text-left cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-1">
          <p className="text-[9px] text-stone-600 leading-snug line-clamp-2 group-hover:text-stone-800 transition-colors flex-1">
            {session.summary}
          </p>
          <span className="text-stone-400 shrink-0 mt-0.5">
            {expanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-1.5 space-y-1.5">
              {session.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {session.topics.map((t, i) => (
                    <span key={i} className="text-[7px] font-mono px-1.5 py-0.5 bg-stone-200 text-stone-600 border border-stone-300 font-bold uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[8px] text-stone-400 font-mono">
                {session.messageCount} messages · {session.dateLabel}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BucketRow({ bucket }: { bucket: HistoryBucket }) {
  const [collapsed, setCollapsed] = useState(bucket.collapsed);

  const iconColor = bucket.type === 'day'
    ? 'text-purple-500'
    : bucket.type === 'month'
    ? 'text-blue-500'
    : 'text-amber-500';

  return (
    <div className="border-b border-stone-200">
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-stone-100 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Clock className={`w-3 h-3 ${iconColor}`} />
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-stone-700">
            {bucket.label}
          </span>
          <span className="text-[8px] font-mono text-stone-400">
            {bucket.sessions.length} {bucket.sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
        <span className="text-stone-400 group-hover:text-stone-600 transition-colors">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {bucket.sessions.map((session, i) => (
                <SessionCard key={i} session={session} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HistoryPanel({ userId, refreshTrigger }: HistoryPanelProps) {
  const [buckets, setBuckets] = useState<HistoryBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    loadAllSummaries().then(summaries => {
      setBuckets(bucketSummaries(summaries));
      setLoading(false);
    });
  }, [userId, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <p className="text-[9px] font-mono text-stone-400 uppercase tracking-wider animate-pulse">Loading history...</p>
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center">
        <MessageSquare className="w-8 h-8 text-stone-400 mb-3 opacity-40" />
        <p className="text-[10px] text-stone-500 font-mono leading-relaxed">
          After each call, Melvin files a short summary here.
        </p>
        <p className="text-[9px] text-stone-400 font-mono mt-2 opacity-70">
          Recent calls by date. Older ones collapse into months, then years.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {buckets.map((bucket, i) => (
        <BucketRow key={i} bucket={bucket} />
      ))}
    </div>
  );
}
