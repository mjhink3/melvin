/**
 * AgentPanel.tsx
 * Agent workspace -- shows what Melvin is doing on your behalf.
 * Live task status, results, task history.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Globe, Cloud, Newspaper, Trophy,
  CheckCircle, Clock, Loader2, ChevronDown,
  ChevronRight, Zap, X
} from 'lucide-react';

export type AgentTaskStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
  timestamp: number;
}

export interface AgentTask {
  id: string;
  query: string;
  type: 'search' | 'weather' | 'news' | 'sports' | 'general';
  status: AgentTaskStatus;
  steps: AgentStep[];
  result?: string;
  startedAt: number;
  completedAt?: number;
}

interface AgentPanelProps {
  currentTask: AgentTask | null;
  taskHistory: AgentTask[];
  onClose?: () => void;
  isMobile?: boolean;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="w-3.5 h-3.5" />,
  weather: <Cloud className="w-3.5 h-3.5" />,
  news: <Newspaper className="w-3.5 h-3.5" />,
  sports: <Trophy className="w-3.5 h-3.5" />,
  general: <Globe className="w-3.5 h-3.5" />,
};

function TaskStepRow({ step }: { step: AgentStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 py-1"
    >
      <div className="shrink-0 mt-0.5">
        {step.status === 'running' && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
        {step.status === 'done' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
        {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-stone-600" />}
        {step.status === 'error' && <X className="w-3 h-3 text-rose-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-mono leading-snug ${
          step.status === 'running' ? 'text-purple-300' :
          step.status === 'done' ? 'text-stone-300' :
          step.status === 'error' ? 'text-rose-400' :
          'text-stone-600'
        }`}>
          {step.label}
        </p>
        {step.result && step.status === 'done' && (
          <p className="text-[9px] text-stone-500 mt-0.5 leading-snug">{step.result}</p>
        )}
      </div>
    </motion.div>
  );
}

function ActiveTask({ task }: { task: AgentTask }) {
  const elapsed = task.completedAt
    ? ((task.completedAt - task.startedAt) / 1000).toFixed(1)
    : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Task header */}
      <div className="px-4 py-3 border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-purple-400">{TASK_ICONS[task.type]}</span>
          <span className="text-[9px] font-mono font-black uppercase tracking-wider text-stone-400">
            {task.status === 'running' ? 'Working on it...' : task.status === 'done' ? `Done · ${elapsed}s` : 'Task'}
          </span>
          {task.status === 'running' && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-1.5 h-1.5 bg-purple-400 rounded-full"
            />
          )}
        </div>
        <p className="text-white text-sm font-medium leading-snug">"{task.query}"</p>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {task.steps.map(step => (
          <TaskStepRow key={step.id} step={step} />
        ))}
      </div>

      {/* Result */}
      {task.result && task.status === 'done' && (
        <div className="px-4 py-4 border-t border-stone-800 shrink-0">
          <p className="text-[9px] font-mono font-black uppercase tracking-wider text-emerald-400 mb-2">Result</p>
          <div className="bg-stone-900 border border-stone-700 p-3 rounded">
            <p className="text-stone-200 text-xs leading-relaxed">{task.result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryItem({ task }: { task: AgentTask }) {
  const [expanded, setExpanded] = useState(false);
  const elapsed = task.completedAt
    ? ((task.completedAt - task.startedAt) / 1000).toFixed(1)
    : '?';

  return (
    <div className="border-b border-stone-800 last:border-0">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-start gap-2 px-4 py-2.5 hover:bg-stone-900 transition-colors cursor-pointer text-left"
      >
        <span className="text-stone-500 shrink-0 mt-0.5">{TASK_ICONS[task.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-stone-300 leading-snug truncate">{task.query}</p>
          <p className="text-[8px] font-mono text-stone-600 mt-0.5">{elapsed}s · {task.steps.length} steps</p>
        </div>
        <span className="text-stone-600 shrink-0">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
      </button>
      <AnimatePresence>
        {expanded && task.result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <p className="text-[9px] text-stone-400 leading-relaxed">{task.result}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgentPanel({ currentTask, taskHistory, onClose, isMobile = false }: AgentPanelProps) {
  const hasHistory = taskHistory.length > 0;
  const isIdle = !currentTask || currentTask.status === 'idle';

  return (
    <div className={`flex flex-col bg-[#0D0C0B] overflow-hidden ${isMobile ? 'h-full' : 'h-full border-l border-stone-800'}`}>

      {/* Header */}
      <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={currentTask?.status === 'running' ? { rotate: 360 } : { rotate: 0 }}
            transition={{ repeat: currentTask?.status === 'running' ? Infinity : 0, duration: 2, ease: 'linear' }}
          >
            <Zap className={`w-3.5 h-3.5 ${currentTask?.status === 'running' ? 'text-purple-400' : 'text-stone-500'}`} />
          </motion.div>
          <span className="font-mono text-[9px] font-black uppercase tracking-widest text-stone-400">
            {currentTask?.status === 'running' ? 'Melvin is working...' : 'Agent Mode'}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-stone-600 hover:text-stone-300 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      {currentTask && currentTask.status !== 'idle' ? (
        <ActiveTask task={currentTask} />
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Idle state */}
          {!hasHistory && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
              <Globe className="w-10 h-10 text-stone-700" />
              <p className="text-stone-500 text-[10px] font-mono leading-relaxed">
                Ask Melvin to do something and he'll get to work.
              </p>
              <div className="space-y-1.5 w-full">
                {[
                  "What's the weather in Seattle?",
                  "Any NFL scores today?",
                  "What's happening in tech news?",
                ].map((prompt, i) => (
                  <p key={i} className="text-[9px] text-stone-600 font-mono italic">"{prompt}"</p>
                ))}
              </div>
            </div>
          )}

          {/* Task history */}
          {hasHistory && (
            <>
              <div className="px-4 py-2 border-b border-stone-800 shrink-0">
                <p className="text-[8px] font-mono font-black uppercase tracking-wider text-stone-600">Recent tasks</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {taskHistory.slice().reverse().map(task => (
                  <HistoryItem key={task.id} task={task} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
