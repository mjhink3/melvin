/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LifeMap, MemoryFile } from '../types';
import { 
  Folder, 
  FolderOpen, 
  BookOpen, 
  FileText, 
  Tag, 
  Clock, 
  User, 
  Briefcase, 
  Flame, 
  Compass, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MemoryBankPanelProps {
  lifeMap: LifeMap;
  onSendMessage?: (msg: string) => void;
}

export default function MemoryBankPanel({ lifeMap, onSendMessage }: MemoryBankPanelProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'files' | 'threads'>('files');

  const { memoryFiles = [], unfinishedThreads = [] } = lifeMap;

  const currentFile = memoryFiles.find(f => f.file_id === selectedFileId);

  return (
    <div className="bg-[#FAF8F5] border-4 border-stone-900 h-[680px] flex flex-col justify-between text-stone-900 brutalist-shadow-lg relative overflow-hidden select-text font-sans">
      
      {/* Notebook Top Header */}
      <div className="p-4 bg-[#F2EDE4] border-b-2 border-stone-900 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2.5">
          <BookOpen className="w-5 h-5 text-stone-800" />
          <div>
            <h2 className="font-display font-black text-sm uppercase tracking-wide text-stone-900">
              Melvin's Cognitive Records
            </h2>
            <p className="font-mono text-[9px] text-stone-600 uppercase font-bold tracking-wider">
              Memory Bank • Transparency View Only
            </p>
          </div>
        </div>
        <div className="font-mono text-[10px] bg-stone-900 text-stone-100 px-2 py-0.5 rounded-none uppercase font-bold self-center">
          Notebook
        </div>
      </div>

      {/* Tabs navigation: Notebook divider sheets appearance */}
      <div className="flex border-b border-stone-800 shrink-0 text-xs font-mono bg-[#EFECE6]">
        {(['files', 'threads'] as const).map((section) => {
          const isActive = activeSection === section;
          const sectionLabel = 
            section === 'files' ? 'Memory Files' : 'Open Threads';
          return (
            <button
              key={section}
              onClick={() => {
                setActiveSection(section);
                if (section !== 'files') setSelectedFileId(null);
              }}
              className={`flex-1 py-2.5 text-center transition-all cursor-pointer border-r last:border-r-0 border-stone-800 font-bold uppercase text-[10px] select-none ${
                isActive 
                  ? 'bg-[#FAF8F5] text-stone-950 font-black border-t-2 border-t-purple-600' 
                  : 'text-stone-550 hover:bg-[#FAF8F5]/50'
              }`}
            >
              {sectionLabel}
            </button>
          );
        })}
      </div>

      {/* Notebook Content Workspace */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-[#FAF8F5] relative">
        <AnimatePresence mode="wait">
          
          {/* 1. SECTIONS: Memory Files */}
          {activeSection === 'files' && (
            <motion.div
              key="files-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 h-full flex flex-col"
            >
              {!selectedFileId ? (
                // FILES LIST INDEX VIEW
                <div className="space-y-3">
                  <div className="bg-[#EAE5DC]/60 p-3 border border-stone-850/60 rounded-sm">
                    <p className="text-[11.5px] leading-relaxed text-stone-700 italic">
                      These are the long-term semantic records Melvin maintains behind the scenes. They compile recurring themes, relevant projects, and interpersonal ties automatically.
                    </p>
                  </div>

                  {memoryFiles.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 space-y-2">
                      <Folder className="w-10 h-10 mx-auto stroke-1" />
                      <p className="text-xs font-mono uppercase font-black tracking-widest text-stone-500">Records currently vacant</p>
                      <p className="text-[10px] max-w-xs mx-auto italic text-stone-400">
                        Chat naturally to establish themed memories automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {memoryFiles.map((file) => (
                        <button
                          key={file.file_id}
                          onClick={() => setSelectedFileId(file.file_id)}
                          className="w-full text-left p-3.5 bg-white border-2 border-stone-850 hover:border-stone-950 hover:bg-[#FAF6F0] rounded-none shadow-xs transition-all cursor-pointer flex justify-between items-center group"
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className="p-2.5 bg-purple-50 group-hover:bg-purple-100/80 border border-purple-200 text-[#7C3AED] rounded-sm">
                              <Folder className="w-4 h-4 fill-purple-100" />
                            </div>
                            <div>
                              <h4 className="font-sans font-bold text-sm text-stone-900 group-hover:text-purple-800">
                                {file.title}
                              </h4>
                              <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                                Mapped: {file.last_updated} • Importance: {file.importance_score}/10
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-450 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // SPECIFIC FILE DETAIL VIEW
                currentFile && (
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {/* Back header */}
                    <button
                      onClick={() => setSelectedFileId(null)}
                      className="cursor-pointer text-[10.5px] font-mono uppercase font-black text-stone-500 hover:text-stone-900 flex items-center space-x-1"
                    >
                      <span>← Back to Index</span>
                    </button>

                    <div className="p-4 bg-white border-2 border-stone-900 rounded-none shadow-sm space-y-4">
                      {/* File Details Cover Header */}
                      <div className="border-b border-stone-200 pb-3 flex justify-between items-start">
                        <div>
                          <span className="font-mono text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 font-black border border-purple-200 uppercase rounded-sm inline-block mb-1.5">
                            Hidden File
                          </span>
                          <h3 className="font-display font-black text-lg text-stone-900 uppercase tracking-tight">
                            {currentFile.title}
                          </h3>
                          <p className="text-xs text-stone-500 italic mt-0.5 font-sans leading-relaxed">
                            "{currentFile.description}"
                          </p>
                        </div>
                        <div className="font-mono text-right text-[10px] text-stone-500">
                          <p>Score: <span className="text-stone-900 font-bold">{currentFile.importance_score}/10</span></p>
                          <p className="text-[8.5px]">Mapped {currentFile.last_updated}</p>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="space-y-1">
                        <h4 className="font-mono text-[9px] uppercase font-black tracking-wider text-purple-700 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Mapped Narrative Summary:
                        </h4>
                        <p className="text-[12.5px] leading-relaxed text-stone-800 font-normal">
                          {currentFile.summary}
                        </p>
                      </div>

                      {/* Related Entities Metadata Tag cloud */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 border-t border-stone-100 pt-3">
                        <div className="space-y-1">
                          <span className="font-mono text-[9px] uppercase font-black tracking-wider text-amber-700 block">
                            Recognized Keywords:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {currentFile.keywords?.length > 0 ? (
                              currentFile.keywords.map((kw, i) => (
                                <span key={i} className="text-[9.5px] bg-stone-100 text-stone-700 border border-stone-250 px-1.5 py-0.5 font-mono">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9.5px] text-stone-400 italic">None</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="font-mono text-[9px] uppercase font-black tracking-wider text-teal-700 block">
                            Emotional Alignment:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {currentFile.emotional_tags?.length > 0 ? (
                              currentFile.emotional_tags.map((tag, i) => (
                                <span key={i} className="text-[9.5px] bg-[#EEF2F6] text-blue-700 border border-blue-200 px-1.5 py-0.5 font-mono uppercase tracking-wider font-extrabold flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5" /> {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9.5px] text-stone-400 italic">None</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Related People and Projects */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1 border-t border-stone-100 pt-3">
                        <div className="space-y-1">
                          <span className="font-mono text-[9px] uppercase font-black tracking-wider text-[#7C3AED] block">
                            Recognized People:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {currentFile.related_people?.length > 0 ? (
                              currentFile.related_people.map((p, i) => (
                                <span key={i} className="text-[9.5px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 font-mono font-medium flex items-center gap-1">
                                  <User className="w-2.5 h-2.5" /> {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9.5px] text-stone-400 italic">None</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="font-mono text-[9px] uppercase font-black tracking-wider text-[#7C3AED] block">
                            Recognized Projects:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {currentFile.related_projects?.length > 0 ? (
                              currentFile.related_projects.map((proj, i) => (
                                <span key={i} className="text-[9.5px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 font-mono font-medium flex items-center gap-1">
                                  <Briefcase className="w-2.5 h-2.5" /> {proj}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9.5px] text-stone-400 italic">None</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Key memories list */}
                      {currentFile.key_memories?.length > 0 && (
                        <div className="space-y-1.5 border-t border-stone-100 pt-3">
                          <h5 className="font-mono text-[9px] uppercase font-black tracking-wider text-rose-700">
                            Deep Archived Memories:
                          </h5>
                          <ul className="space-y-1 text-xs text-stone-700">
                            {currentFile.key_memories.map((m, i) => (
                              <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                <span className="text-rose-500 font-bold select-none">•</span>
                                <span className="font-sans font-medium">{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Unresolved threads list */}
                      {currentFile.unresolved_threads?.length > 0 && (
                        <div className="space-y-1.5 border-t border-stone-100 pt-3">
                          <h5 className="font-mono text-[9px] uppercase font-black tracking-wider text-indigo-700">
                            Unresolved Dilemmas / Tension Points:
                          </h5>
                          <ul className="space-y-1 text-xs text-stone-700">
                            {currentFile.unresolved_threads.map((t, i) => (
                              <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                <span className="text-indigo-500 font-bold select-none">•</span>
                                <span className="font-sans font-semibold">{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Trigger Questions list */}
                      {currentFile.trigger_questions?.length > 0 && (
                        <div className="space-y-1.5 border-t border-stone-100 pt-3 bg-[#FAF8F5] p-2.5 border border-stone-300 rounded-sm">
                          <h5 className="font-mono text-[9.5px] uppercase font-black tracking-wider text-teal-700 flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5" /> Potential Reflection Triggers:
                          </h5>
                          <div className="space-y-1">
                            {currentFile.trigger_questions.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (onSendMessage) onSendMessage(q);
                                }}
                                className={`w-full text-left text-[11px] font-sans font-semibold text-stone-800 hover:text-purple-700 hover:underline cursor-pointer block leading-relaxed ${onSendMessage ? 'hover:translate-x-0.5' : 'pointer-events-none'} transition-all`}
                              >
                                {q} {onSendMessage && <span className="text-[10px] text-purple-400 font-bold">→ Ask Melvin</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )
              )}
            </motion.div>
          )}

          {/* 2. SECTIONS: Unfinished / Open Threads */}
          {activeSection === 'threads' && (
            <motion.div
              key="threads-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="bg-[#EAE5DC]/60 p-3 border border-stone-850/60 rounded-sm">
                <p className="text-[11px] leading-relaxed text-stone-600 font-sans">
                  These are core conversational loop files Melvin keeps on hold. If you side-step an uncomfortable topic, he notes it here to circle back organically.
                </p>
              </div>

              {unfinishedThreads.filter(t => t.status === 'open').length === 0 ? (
                <div className="py-16 text-center text-stone-400 space-y-1.5 animate-pulse">
                  <Sparkles className="w-9 h-9 mx-auto stroke-1 text-teal-600" />
                  <p className="text-xs font-mono uppercase font-black tracking-widest text-[#0D9488]">All threads resolved</p>
                  <p className="text-[10px] italic text-stone-500">Every dialogue loop was tied with a tidy knot.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unfinishedThreads.filter(t => t.status === 'open').map((thread) => (
                    <div 
                      key={thread.id}
                      className="p-3.5 bg-white border-2 border-stone-900 rounded-none shadow-xs space-y-2 relative"
                    >
                      <div className="flex justify-between items-center border-b border-stone-100 pb-1.5">
                        <span className="font-mono text-[9px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-sm inline-block">
                          Open Loop
                        </span>
                        <span className="text-[10px] font-mono text-stone-450 font-bold">{thread.timestamp}</span>
                      </div>

                      <div>
                        <h4 className="font-sans font-bold text-xs text-stone-900">
                          Topic: {thread.topic}
                        </h4>
                        <p className="text-[11.5px] leading-relaxed text-stone-600 italic mt-0.5 font-sans">
                          Context: "{thread.context}"
                        </p>
                      </div>

                      {thread.triggerQuestion && (
                        <div className="bg-[#EEF2F6]/75 hover:bg-[#EEF2F6] transition-colors border border-blue-200 p-2 text-stone-800 space-y-1 rounded-sm mt-2">
                          <span className="font-mono text-[9px] text-indigo-700 uppercase font-black tracking-wider block">
                            Melvin's Re-entry Trigger:
                          </span>
                          <button
                            onClick={() => {
                              if (onSendMessage) onSendMessage(thread.triggerQuestion);
                            }}
                            className={`w-full text-left text-[11px] font-sans font-semibold text-stone-900 hover:text-purple-700 hover:underline cursor-pointer block leading-relaxed ${onSendMessage ? 'hover:translate-x-0.5' : 'pointer-events-none'} transition-all`}
                          >
                            "{thread.triggerQuestion}" {onSendMessage && <span className="text-[10px] text-purple-400 font-bold">→ Ask</span>}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Notebook Bottom binding edge style */}
      <div className="p-3 bg-[#F2EDE4] border-t border-stone-900 text-center text-[9px] text-[#7C3AED] font-mono font-bold uppercase tracking-widest shrink-0 select-none">
        * Autonomic Memory Engine • Secure local compilation *
      </div>

    </div>
  );
}
