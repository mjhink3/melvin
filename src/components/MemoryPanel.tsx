/**
 * MemoryPanel.tsx
 * Five-bucket live memory panel: Identity, People, Projects, Feelings, Threads
 * With per-item delete with confirmation prompt.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Users, FolderOpen, Heart, MessageSquare,
  Sparkles, ChevronDown, ChevronRight, X, Trash2, Clock
} from 'lucide-react';
import HistoryPanel from './HistoryPanel';

export interface MemoryBuckets {
  identity: {
    name?: string;
    location?: string;
    role?: string;
    values?: string[];
  };
  people: {
    name: string;
    relationship: string;
    notes?: string;
  }[];
  projects: {
    name: string;
    description?: string;
    status?: string;
  }[];
  feelings: {
    energizers?: string[];
    stressors?: string[];
    patterns?: string[];
  };
  threads: {
    topic: string;
    question?: string;
    opened?: string;
  }[];
}

interface DeleteConfirmProps {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ label, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center"
    >
      <p className="text-[10px] font-bold text-stone-800 leading-snug mb-1">
        Are you sure you want Melvin to forget this?
      </p>
      <p className="text-[9px] text-stone-500 italic mb-3 leading-snug">"{label}"</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 bg-rose-600 text-white text-[9px] font-mono font-black uppercase tracking-wider cursor-pointer hover:bg-rose-500 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Forget it
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-stone-200 text-stone-700 text-[9px] font-mono font-black uppercase tracking-wider cursor-pointer hover:bg-stone-300 transition-colors"
        >
          Keep it
        </button>
      </div>
    </motion.div>
  );
}

interface BucketConfig {
  key: keyof MemoryBuckets;
  label: string;
  icon: React.ReactNode;
  color: string;
  emptyLine: string;
}

const BUCKETS: BucketConfig[] = [
  { key: 'identity', label: 'Identity', icon: <User className="w-3.5 h-3.5" />, color: 'text-purple-600', emptyLine: 'Who you are. Melvin is still learning.' },
  { key: 'people', label: 'People', icon: <Users className="w-3.5 h-3.5" />, color: 'text-blue-600', emptyLine: 'People in your life will appear here.' },
  { key: 'projects', label: 'Projects', icon: <FolderOpen className="w-3.5 h-3.5" />, color: 'text-amber-600', emptyLine: "Things you're working on will show up here." },
  { key: 'feelings', label: 'Feelings', icon: <Heart className="w-3.5 h-3.5" />, color: 'text-rose-500', emptyLine: 'Patterns, stressors, energizers — over time.' },
  { key: 'threads', label: 'Threads', icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-emerald-600', emptyLine: 'Open questions Melvin wants to come back to.' },
];

function isEmpty(bucket: keyof MemoryBuckets, memory: MemoryBuckets): boolean {
  const val = memory[bucket];
  if (!val) return true;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.values(val).every(v => !v || (Array.isArray(v) && v.length === 0));
  return false;
}

// Deletable item wrapper
function DeletableItem({ label, onDelete, children }: { label: string; onDelete: () => void; children: React.ReactNode }) {
  const [confirming, setConfirming] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
    >
      {children}
      <AnimatePresence>
        {hovered && !confirming && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setConfirming(true)}
            className="absolute top-0 right-0 w-5 h-5 bg-rose-100 border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center cursor-pointer transition-all rounded-sm"
            title="Forget this"
          >
            <X className="w-3 h-3" />
          </motion.button>
        )}
        {confirming && (
          <DeleteConfirm
            label={label}
            onConfirm={() => { setConfirming(false); onDelete(); }}
            onCancel={() => { setConfirming(false); setHovered(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Deletable tag (for feelings)
function DeletableTag({ label, color, onDelete }: { label: string; color: string; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="relative inline-flex">
      {confirming ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-300"
        >
          <span className="text-[8px] text-rose-600 font-mono font-black uppercase">Forget?</span>
          <button onClick={() => { onDelete(); setConfirming(false); }} className="text-[8px] text-rose-600 hover:text-rose-800 font-black cursor-pointer">Yes</button>
          <button onClick={() => setConfirming(false)} className="text-[8px] text-stone-500 hover:text-stone-700 font-black cursor-pointer">No</button>
        </motion.div>
      ) : (
        <span
          className={`group text-[9px] px-1.5 py-0.5 border font-medium flex items-center gap-1 ${color}`}
        >
          {label}
          <button
            onClick={() => setConfirming(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-current hover:text-rose-500"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      )}
    </div>
  );
}

function IdentityContent({ data, onDelete }: { data: MemoryBuckets['identity']; onDelete: (field: string, value?: string) => void }) {
  if (!data) return null;
  const items = [
    data.name && { label: 'Name', field: 'name', value: data.name },
    data.location && { label: 'Location', field: 'location', value: data.location },
    data.role && { label: 'Role', field: 'role', value: data.role },
  ].filter(Boolean) as { label: string; field: string; value: string }[];

  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <DeletableItem key={item.field} label={`${item.label}: ${item.value}`} onDelete={() => onDelete(item.field)}>
          <div className="flex gap-2 pr-6">
            <span className="text-[8px] font-mono font-black uppercase tracking-wider text-stone-400 w-14 shrink-0 pt-px">{item.label}</span>
            <span className="text-[10px] text-stone-700 leading-snug">{item.value}</span>
          </div>
        </DeletableItem>
      ))}
      {data.values?.map((v, i) => (
        <DeletableItem key={i} label={`Value: ${v}`} onDelete={() => onDelete('value', v)}>
          <div className="flex gap-2 pr-6">
            <span className="text-[8px] font-mono font-black uppercase tracking-wider text-stone-400 w-14 shrink-0 pt-px">Values</span>
            <span className="text-[10px] text-stone-700 leading-snug">{v}</span>
          </div>
        </DeletableItem>
      ))}
    </div>
  );
}

function PeopleContent({ data, onDelete }: { data: MemoryBuckets['people']; onDelete: (idx: number) => void }) {
  return (
    <div className="space-y-2">
      {data.map((person, i) => (
        <DeletableItem key={i} label={`${person.name} (${person.relationship})`} onDelete={() => onDelete(i)}>
          <div className="border-l-2 border-blue-200 pl-2 pr-6">
            <p className="text-[10px] font-bold text-stone-800">{person.name}</p>
            <p className="text-[9px] text-stone-500 italic">{person.relationship}</p>
            {person.notes && <p className="text-[9px] text-stone-500 mt-0.5 leading-snug">{person.notes}</p>}
          </div>
        </DeletableItem>
      ))}
    </div>
  );
}

function ProjectsContent({ data, onDelete }: { data: MemoryBuckets['projects']; onDelete: (idx: number) => void }) {
  return (
    <div className="space-y-2">
      {data.map((project, i) => (
        <DeletableItem key={i} label={project.name} onDelete={() => onDelete(i)}>
          <div className="border-l-2 border-amber-200 pl-2 pr-6">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold text-stone-800">{project.name}</p>
              {project.status && (
                <span className="text-[7px] font-mono font-black uppercase tracking-wider px-1 py-0.5 bg-amber-100 text-amber-700 border border-amber-200">
                  {project.status}
                </span>
              )}
            </div>
            {project.description && <p className="text-[9px] text-stone-500 mt-0.5 leading-snug">{project.description}</p>}
          </div>
        </DeletableItem>
      ))}
    </div>
  );
}

function FeelingsContent({ data, onDelete }: { data: MemoryBuckets['feelings']; onDelete: (category: string, value: string) => void }) {
  const sections = [
    { label: 'Energizers', key: 'energizers', items: data.energizers, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Stressors', key: 'stressors', items: data.stressors, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { label: 'Patterns', key: 'patterns', items: data.patterns, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ].filter(s => s.items && s.items.length > 0);

  return (
    <div className="space-y-2">
      {sections.map(section => (
        <div key={section.key}>
          <p className="text-[8px] font-mono font-black uppercase tracking-wider text-stone-400 mb-1">{section.label}</p>
          <div className="flex flex-wrap gap-1">
            {section.items!.map((item, i) => (
              <DeletableTag
                key={i}
                label={item}
                color={section.color}
                onDelete={() => onDelete(section.key, item)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadsContent({ data, onDelete, onAsk }: { data: MemoryBuckets['threads']; onDelete: (idx: number) => void; onAsk?: (q: string) => void }) {
  return (
    <div className="space-y-2">
      {data.map((thread, i) => (
        <DeletableItem key={i} label={thread.topic} onDelete={() => onDelete(i)}>
          <div className="border-l-2 border-emerald-200 pl-2 pr-6">
            <p className="text-[10px] font-bold text-stone-800">{thread.topic}</p>
            {thread.question && (
              <p className="text-[9px] text-stone-500 italic mt-0.5 leading-snug">"{thread.question}"</p>
            )}
            {onAsk && thread.question && (
              <button
                onClick={() => onAsk(thread.question!)}
                className="mt-1 text-[8px] font-mono font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-800 cursor-pointer transition-colors"
              >
                Ask this now →
              </button>
            )}
          </div>
        </DeletableItem>
      ))}
    </div>
  );
}

interface MemoryPanelProps {
  memory: MemoryBuckets;
  onAsk?: (question: string) => void;
  isExtracting?: boolean;
  onMemoryUpdate?: (updated: MemoryBuckets) => void;
  userId?: string;
  historyRefreshTrigger?: number;
}

export default function MemoryPanel({ memory, onAsk, isExtracting = false, onMemoryUpdate, userId, historyRefreshTrigger }: MemoryPanelProps) {
  const [openBuckets, setOpenBuckets] = useState<Set<string>>(new Set(['identity']));
  const [newBuckets, setNewBuckets] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'memory' | 'history'>('memory');
  const prevMemoryRef = useRef<string>('');

  useEffect(() => {
    const current = JSON.stringify(memory);
    if (current !== prevMemoryRef.current && prevMemoryRef.current) {
      const prev = JSON.parse(prevMemoryRef.current || '{}');
      const flashed = new Set<string>();
      BUCKETS.forEach(b => {
        const prevVal = JSON.stringify(prev[b.key]);
        const currVal = JSON.stringify(memory[b.key]);
        if (prevVal !== currVal && !isEmpty(b.key, memory)) {
          flashed.add(b.key);
          setOpenBuckets(s => new Set([...s, b.key]));
        }
      });
      if (flashed.size > 0) {
        setNewBuckets(flashed);
        setTimeout(() => setNewBuckets(new Set()), 4000);
      }
    }
    prevMemoryRef.current = current;
  }, [memory]);

  const toggle = (key: string) => {
    setOpenBuckets(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Delete helpers -- each returns an updated memory object
  const deleteIdentityField = (field: string, value?: string) => {
    const updated = { ...memory, identity: { ...memory.identity } };
    if (field === 'value' && value) {
      updated.identity.values = (updated.identity.values || []).filter(v => v !== value);
    } else {
      delete (updated.identity as any)[field];
    }
    onMemoryUpdate?.(updated);
  };

  const deletePerson = (idx: number) => {
    const updated = { ...memory, people: memory.people.filter((_, i) => i !== idx) };
    onMemoryUpdate?.(updated);
  };

  const deleteProject = (idx: number) => {
    const updated = { ...memory, projects: memory.projects.filter((_, i) => i !== idx) };
    onMemoryUpdate?.(updated);
  };

  const deleteFeeling = (category: string, value: string) => {
    const updated = {
      ...memory,
      feelings: {
        ...memory.feelings,
        [category]: ((memory.feelings as any)[category] || []).filter((v: string) => v !== value)
      }
    };
    onMemoryUpdate?.(updated);
  };

  const deleteThread = (idx: number) => {
    const updated = { ...memory, threads: memory.threads.filter((_, i) => i !== idx) };
    onMemoryUpdate?.(updated);
  };

  const totalItems =
    (memory.people?.length || 0) +
    (memory.projects?.length || 0) +
    (memory.threads?.length || 0) +
    (memory.feelings?.energizers?.length || 0) +
    (memory.feelings?.stressors?.length || 0) +
    (!isEmpty('identity', memory) ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-[#F5F0E8] overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 bg-[#EDE8DF] border-b-2 border-stone-900 shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span className="font-mono text-[9px] font-black uppercase tracking-widest text-purple-700">
              {activeTab === 'memory' ? 'Live Memory' : 'Call History'}
            </span>
          </div>
          <AnimatePresence>
            {isExtracting && activeTab === 'memory' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                <span className="text-[7px] font-mono font-black uppercase tracking-wider text-purple-600">Filing...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-[8px] text-stone-500 font-mono leading-tight">
          {activeTab === 'memory'
            ? (totalItems === 0 ? "Talk for a bit. He's paying attention." : `${totalItems} item${totalItems !== 1 ? 's' : ''} recorded. You own this.`)
            : "Every call summarised. Dates collapse into months, months into years."
          }
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b-2 border-stone-900 shrink-0">
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 py-2 text-[9px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'memory' ? 'bg-purple-700 text-white' : 'bg-[#EDE8DF] text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Memory
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-[9px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border-l-2 border-stone-900 ${
            activeTab === 'history' ? 'bg-purple-700 text-white' : 'bg-[#EDE8DF] text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-3 h-3" />
          History
        </button>
      </div>

      {/* Content -- memory or history */}
      {activeTab === 'history' ? (
        <HistoryPanel userId={userId || ''} refreshTrigger={historyRefreshTrigger} />
      ) : (
      <div className="flex-1 overflow-y-auto">
        {BUCKETS.map((bucket) => {
          const isOpen = openBuckets.has(bucket.key);
          const empty = isEmpty(bucket.key, memory);
          const isNew = newBuckets.has(bucket.key);

          return (
            <div key={bucket.key} className={`border-b-2 border-stone-200 transition-colors ${isNew ? 'bg-purple-50' : 'bg-transparent'}`}>
              <button
                onClick={() => toggle(bucket.key)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-stone-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className={`${bucket.color} ${empty ? 'opacity-40' : ''}`}>{bucket.icon}</span>
                  <span className={`font-mono text-[10px] font-black uppercase tracking-wider ${empty ? 'text-stone-400' : 'text-stone-800'}`}>
                    {bucket.label}
                  </span>
                  {isNew && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[7px] font-mono font-black uppercase tracking-wider text-purple-600 bg-purple-100 px-1 py-0.5">
                      new
                    </motion.span>
                  )}
                </div>
                <span className="text-stone-400 group-hover:text-stone-600 transition-colors">
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 pt-1">
                      {empty ? (
                        <p className="text-[9px] text-stone-400 italic font-mono leading-relaxed">{bucket.emptyLine}</p>
                      ) : (
                        <>
                          {bucket.key === 'identity' && <IdentityContent data={memory.identity} onDelete={deleteIdentityField} />}
                          {bucket.key === 'people' && <PeopleContent data={memory.people || []} onDelete={deletePerson} />}
                          {bucket.key === 'projects' && <ProjectsContent data={memory.projects || []} onDelete={deleteProject} />}
                          {bucket.key === 'feelings' && <FeelingsContent data={memory.feelings || {}} onDelete={deleteFeeling} />}
                          {bucket.key === 'threads' && <ThreadsContent data={memory.threads || []} onDelete={deleteThread} onAsk={onAsk} />}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      )}
      {/* Footer */}
      <div className="px-3 py-2 bg-[#EDE8DF] border-t-2 border-stone-900 shrink-0 text-center">
        <p className="text-[7.5px] font-mono text-stone-400 uppercase tracking-widest font-bold">
          Private by Design · You own this data
        </p>
      </div>
    </div>
  );
}