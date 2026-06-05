/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ReflectionFacts, ReflectionDecision, ReflectionAvoidance } from '../types';
import { HelpCircle, Layers, ShieldCheck, Zap, AlertCircle, Plus, Trash2, ArrowRight } from 'lucide-react';

interface ThinkingGuidesProps {
  onSendUpdate: (content: string) => void;
}

export default function ThinkingGuides({ onSendUpdate }: ThinkingGuidesProps) {
  const [activeGuide, setActiveGuide] = useState<'facts' | 'decision' | 'avoidance'>('facts');

  // Guide 1: Facts vs Assumptions
  const [factsData, setFactsData] = useState<ReflectionFacts>({
    facts: [''],
    assumptions: [''],
    controllable: [''],
    uncontrollable: ['']
  });

  // Guide 2: Decision Mapper
  const [decisionData, setDecisionData] = useState<ReflectionDecision>({
    coreQuestion: '',
    optionA: { description: '', pros: [''], cons: [''], secondOrderEffects: [''] },
    optionB: { description: '', pros: [''], cons: [''], secondOrderEffects: [''] },
  });

  // Guide 3: Avoidance Spotter
  const [avoidanceData, setAvoidanceData] = useState<ReflectionAvoidance>({
    thingBeingAvoided: '',
    whyIsItDifficult: '',
    whatIsAtStake: '',
    oneSmallAction: ''
  });

  // Helpers for list mutation
  const handleAddListItem = (guide: 'facts' | 'decision', field: string, subField?: 'optionA' | 'optionB', arrayField?: 'pros' | 'cons' | 'secondOrderEffects') => {
    if (guide === 'facts') {
      const key = field as keyof ReflectionFacts;
      setFactsData(prev => ({
        ...prev,
        [key]: [...prev[key], '']
      }));
    } else if (guide === 'decision' && subField && arrayField) {
      setDecisionData(prev => ({
        ...prev,
        [subField]: {
          ...prev[subField],
          [arrayField]: [...prev[subField][arrayField], '']
        }
      }));
    }
  };

  const handleRemoveListItem = (guide: 'facts' | 'decision', field: string, index: number, subField?: 'optionA' | 'optionB', arrayField?: 'pros' | 'cons' | 'secondOrderEffects') => {
    if (guide === 'facts') {
      const key = field as keyof ReflectionFacts;
      if (factsData[key].length <= 1) return;
      setFactsData(prev => ({
        ...prev,
        [key]: prev[key].filter((_, i) => i !== index)
      }));
    } else if (guide === 'decision' && subField && arrayField) {
      if (decisionData[subField][arrayField].length <= 1) return;
      setDecisionData(prev => ({
        ...prev,
        [subField]: {
          ...prev[subField],
          [arrayField]: prev[subField][arrayField].filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleUpdateListItem = (
    guide: 'facts' | 'decision', 
    field: string, 
    index: number, 
    value: string, 
    subField?: 'optionA' | 'optionB', 
    arrayField?: 'pros' | 'cons' | 'secondOrderEffects'
  ) => {
    if (guide === 'facts') {
      const key = field as keyof ReflectionFacts;
      const updated = [...factsData[key]];
      updated[index] = value;
      setFactsData(prev => ({
        ...prev,
        [key]: updated
      }));
    } else if (guide === 'decision' && subField && arrayField) {
      const updated = [...decisionData[subField][arrayField]];
      updated[index] = value;
      setDecisionData(prev => ({
        ...prev,
        [subField]: {
          ...prev[subField],
          [arrayField]: updated
        }
      }));
    }
  };

  // Submit generators
  const submitFactsGuide = () => {
    const factsBlock = factsData.facts.filter(v => v.trim() !== '').map(v => `- ${v}`).join('\n');
    const assublock = factsData.assumptions.filter(v => v.trim() !== '').map(v => `- ${v}`).join('\n');
    const controlblock = factsData.controllable.filter(v => v.trim() !== '').map(v => `- ${v}`).join('\n');
    const uncontrolblock = factsData.uncontrollable.filter(v => v.trim() !== '').map(v => `- ${v}`).join('\n');

    let content = `I want to break down a stressful situation with you using the "Stress De-compressor" framework:\n\n`;
    if (factsBlock) content += `### ✦ The Objective Facts (Things that are indisputably true):\n${factsBlock}\n\n`;
    if (assublock) content += `### ✦ Core Assumptions (My interpretation / what I'm dreading):\n${assublock}\n\n`;
    if (controlblock) content += `### ✦ What's Within My Control:\n${controlblock}\n\n`;
    if (uncontrolblock) content += `### ✦ What's Outside My Control:\n${uncontrolblock}\n`;

    onSendUpdate(content);
    // Reset fields gently
    setFactsData({ facts: [''], assumptions: [''], controllable: [''], uncontrollable: [''] });
  };

  const submitDecisionGuide = () => {
    const question = decisionData.coreQuestion.trim();
    if (!question) return;

    let content = `I have a tough decision to map out with you:\n`;
    content += `**The decision I am facing:** "${question}"\n\n`;

    const optA = decisionData.optionA;
    if (optA.description) {
      content += `### ✦ Option A: ${optA.description}\n`;
      const pros = optA.pros.filter(p => p.trim() !== '').map(p => `- Pros: ${p}`).join('\n');
      const cons = optA.cons.filter(p => p.trim() !== '').map(p => `- Cons: ${p}`).join('\n');
      const sec = optA.secondOrderEffects.filter(p => p.trim() !== '').map(p => `- Second-Order effect (What happens next): ${p}`).join('\n');
      if (pros) content += `${pros}\n`;
      if (cons) content += `${cons}\n`;
      if (sec) content += `${sec}\n`;
      content += `\n`;
    }

    const optB = decisionData.optionB;
    if (optB.description) {
      content += `### ✦ Option B: ${optB.description}\n`;
      const pros = optB.pros.filter(p => p.trim() !== '').map(p => `- Pros: ${p}`).join('\n');
      const cons = optB.cons.filter(p => p.trim() !== '').map(p => `- Cons: ${p}`).join('\n');
      const sec = optB.secondOrderEffects.filter(p => p.trim() !== '').map(p => `- Second-Order effect (What happens next): ${p}`).join('\n');
      if (pros) content += `${pros}\n`;
      if (cons) content += `${cons}\n`;
      if (sec) content += `${sec}\n`;
    }

    onSendUpdate(content);
    setDecisionData({
      coreQuestion: '',
      optionA: { description: '', pros: [''], cons: [''], secondOrderEffects: [''] },
      optionB: { description: '', pros: [''], cons: [''], secondOrderEffects: [''] },
    });
  };

  const submitAvoidanceGuide = () => {
    const thing = avoidanceData.thingBeingAvoided.trim();
    if (!thing) return;

    let content = `I need Melvin to challenge me on an avoidance roadblock:\n\n`;
    content += `1. **The thing I am actively avoiding / dragging my feet on:**\n   "${thing}"\n\n`;
    if (avoidanceData.whyIsItDifficult) {
      content += `2. **Why I find this difficult/dreadful:**\n   "${avoidanceData.whyIsItDifficult}"\n\n`;
    }
    if (avoidanceData.whatIsAtStake) {
      content += `3. **What is genuinely at stake if I keep procrastinating:**\n   "${avoidanceData.whatIsAtStake}"\n\n`;
    }
    if (avoidanceData.oneSmallAction) {
      content += `4. **One micro-action I can execute inside 5 minutes today to crack the deadlock:**\n   "${avoidanceData.oneSmallAction}"\n`;
    }

    onSendUpdate(content);
    setAvoidanceData({ thingBeingAvoided: '', whyIsItDifficult: '', whatIsAtStake: '', oneSmallAction: '' });
  };

  return (
    <div className="bg-[#FAF7F2] border-4 border-stone-900 overflow-hidden font-sans brutalist-shadow rounded-none">
      {/* Tab Selectors */}
      <div className="flex border-b-4 border-stone-900 bg-[#E8E4DE]">
        <button
          onClick={() => setActiveGuide('facts')}
          className={`flex-1 py-3 text-[11px] font-display font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-r border-[#2A2621] cursor-pointer ${
            activeGuide === 'facts' 
              ? 'bg-[#FAF7F2] text-purple-700 font-black border-r-2 border-stone-900' 
              : 'text-stone-700 hover:text-[#7C3AED] hover:bg-[#F2EFE9]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Stress Reliever
        </button>
        <button
          onClick={() => setActiveGuide('decision')}
          className={`flex-1 py-3 text-[11px] font-display font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-r border-[#2A2621] cursor-pointer ${
            activeGuide === 'decision' 
              ? 'bg-[#FAF7F2] text-purple-700 font-black border-r-2 border-l-2 border-stone-900' 
              : 'text-stone-700 hover:text-[#7C3AED] hover:bg-[#F2EFE9]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Decision Explorer
        </button>
        <button
          onClick={() => setActiveGuide('avoidance')}
          className={`flex-1 py-3 text-[11px] font-display font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeGuide === 'avoidance' 
              ? 'bg-[#FAF7F2] text-purple-700 font-black border-l-2 border-stone-900' 
              : 'text-stone-700 hover:text-[#7C3AED] hover:bg-[#F2EFE9]'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Friendly Soundboard
        </button>
      </div>

      <div className="p-5">
        {/* Guide 1: Facts vs Assumptions */}
        {activeGuide === 'facts' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-display font-black tracking-tight text-stone-900 uppercase italic">De-compress a Stress Loop</h3>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                Breakdown a looming problem. Melvin will help you isolate what is real, throw away assumptions, and identify actionable lines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Facts vs Assumptions Column */}
              <div className="space-y-4 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none">
                {/* Facts List */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono uppercase tracking-widest font-black text-stone-950 flex items-center justify-between border-b border-stone-200 pb-1">
                    <span>Indisputable Facts</span>
                    <button 
                      onClick={() => handleAddListItem('facts', 'facts')}
                      className="text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-0.5 border border-purple-200 px-1 py-0.5 bg-purple-50 font-bold"
                    >
                      <Plus className="w-3 h-3" /> ADD
                    </button>
                  </label>
                  {factsData.facts.map((fact, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={fact}
                        onChange={(e) => handleUpdateListItem('facts', 'facts', idx, e.target.value)}
                        placeholder="e.g., The deadline is Wednesday at 5 PM."
                        className="flex-1 bg-white border-2 border-[#2A2621] rounded-none px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                      />
                      {factsData.facts.length > 1 && (
                        <button 
                          onClick={() => handleRemoveListItem('facts', 'facts', idx)}
                          className="text-stone-500 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Assumptions List */}
                <div className="space-y-2 pt-2 border-t-2 border-dashed border-stone-200">
                  <label className="text-[11px] font-mono uppercase tracking-widest font-black text-purple-700 flex items-center justify-between border-b border-stone-200 pb-1">
                    <span>My Internal Assumptions</span>
                    <button 
                      onClick={() => handleAddListItem('facts', 'assumptions')}
                      className="text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-0.5 border border-purple-200 px-1 py-0.5 bg-purple-50 font-bold"
                    >
                      <Plus className="w-3 h-3" /> ADD
                    </button>
                  </label>
                  {factsData.assumptions.map((ass, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={ass}
                        onChange={(e) => handleUpdateListItem('facts', 'assumptions', idx, e.target.value)}
                        placeholder="e.g., If I ask for an extension, they will think I am incompetent."
                        className="flex-1 bg-white border-2 border-[#2A2621] rounded-none px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                      />
                      {factsData.assumptions.length > 1 && (
                        <button 
                          onClick={() => handleRemoveListItem('facts', 'assumptions', idx)}
                          className="text-stone-500 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Controllable vs Uncontrollable Column */}
              <div className="space-y-4 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none">
                {/* Controllable List */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono uppercase tracking-widest font-black text-emerald-800 flex items-center justify-between border-b border-stone-200 pb-1">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Inside My Control</span>
                    <button 
                      onClick={() => handleAddListItem('facts', 'controllable')}
                      className="text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-0.5 border border-purple-200 px-1 py-0.5 bg-purple-50 font-bold"
                    >
                      <Plus className="w-3 h-3" /> ADD
                    </button>
                  </label>
                  {factsData.controllable.map((c, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={c}
                        onChange={(e) => handleUpdateListItem('facts', 'controllable', idx, e.target.value)}
                        placeholder="e.g., Starting the introduction draft tonight."
                        className="flex-1 bg-white border-2 border-[#2A2621] rounded-none px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                      />
                      {factsData.controllable.length > 1 && (
                        <button 
                          onClick={() => handleRemoveListItem('facts', 'controllable', idx)}
                          className="text-stone-500 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Uncontrollable List */}
                <div className="space-y-2 pt-2 border-t-2 border-dashed border-stone-200">
                  <label className="text-[11px] font-mono uppercase tracking-widest font-black text-amber-800 flex items-center justify-between border-b border-stone-200 pb-1">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-600" /> Outside My Control</span>
                    <button 
                      onClick={() => handleAddListItem('facts', 'uncontrollable')}
                      className="text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-0.5 border border-purple-200 px-1 py-0.5 bg-purple-50 font-bold"
                    >
                      <Plus className="w-3 h-3" /> ADD
                    </button>
                  </label>
                  {factsData.uncontrollable.map((u, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={u}
                        onChange={(e) => handleUpdateListItem('facts', 'uncontrollable', idx, e.target.value)}
                        placeholder="e.g., When my teammate replies to my email."
                        className="flex-1 bg-white border-2 border-[#2A2621] rounded-none px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-purple-600 font-medium"
                      />
                      {factsData.uncontrollable.length > 1 && (
                        <button 
                          onClick={() => handleRemoveListItem('facts', 'uncontrollable', idx)}
                          className="text-stone-500 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={submitFactsGuide}
                className="bg-stone-900 hover:bg-[#7C3AED] text-white py-3.5 px-6 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all brutalist-shadow-purple flex items-center justify-center gap-1.5 cursor-pointer hover:text-white rounded-none"
              >
                <span>Analyze with Melvin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Guide 2: Decision Mapper */}
        {activeGuide === 'decision' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-display font-black tracking-tight text-stone-900 uppercase italic">Map Second-Order Consequences</h3>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                Compare two ways forward. Melvin will evaluate if you are falling for short-term ease over structural growth.
              </p>
            </div>

            <div className="space-y-4 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-black uppercase tracking-widest text-[#7C3AED]">What is the core decision or question?</label>
                <input
                  type="text"
                  value={decisionData.coreQuestion}
                  onChange={(e) => setDecisionData(p => ({ ...p, coreQuestion: e.target.value }))}
                  placeholder="e.g., Design: Should I accept the low-paying creative role or stay in corporate?"
                  className="w-full bg-white border-2 border-[#2A2621] rounded-none px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#7C3AED] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Option A */}
                <div className="space-y-3 p-4 bg-[#FAF7F2] border-2 border-stone-900 rounded-none brutalist-shadow-sm">
                  <div className="pb-1 border-b-2 border-stone-900 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-stone-900">Option A Description</span>
                  </div>
                  <input
                    type="text"
                    value={decisionData.optionA.description}
                    onChange={(e) => setDecisionData(v => {
                      const opt = { ...v.optionA, description: e.target.value };
                      return { ...v, optionA: opt };
                    })}
                    placeholder="e.g., Take the creative role."
                    className="w-full bg-white border-2 border-stone-900 rounded-none px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#7C3AED] font-medium"
                  />
                  {/* Option A Second-Order Effects */}
                  <div className="space-y-2 pt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-purple-700 font-mono font-black uppercase tracking-wider">LONG-TERM EFFECTS</span>
                      <button 
                        onClick={() => handleAddListItem('decision', 'secondOrderEffects', 'optionA', 'secondOrderEffects')}
                        className="text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-0.5 border border-purple-200 px-1 py-0.5 bg-purple-50 font-bold text-[9px]"
                      >
                        <Plus className="w-2.5 h-2.5 mr-0.5" /> ADD
                      </button>
                    </div>
                    {decisionData.optionA.secondOrderEffects.map((item, id) => (
                      <div key={id} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...decisionData.optionA.secondOrderEffects];
                            updated[id] = e.target.value;
                            setDecisionData(prev => ({
                              ...prev,
                              optionA: { ...prev.optionA, secondOrderEffects: updated }
                            }));
                          }}
                          placeholder="e.g., Building a specialized creative portfolio."
                          className="flex-1 bg-white border-2 border-stone-300 rounded-none px-2 py-1 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                        />
                        {decisionData.optionA.secondOrderEffects.length > 1 && (
                          <button 
                            onClick={() => handleRemoveListItem('decision', 'secondOrderEffects', id, 'optionA', 'secondOrderEffects')}
                            className="text-stone-500 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Option B */}
                <div className="space-y-3 p-4 bg-[#FAF7F2] border-2 border-stone-900 rounded-none brutalist-shadow-sm">
                  <div className="pb-1 border-b-2 border-stone-900 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-stone-900">Option B Description</span>
                  </div>
                  <input
                    type="text"
                    value={decisionData.optionB.description}
                    onChange={(e) => setDecisionData(v => {
                      const opt = { ...v.optionB, description: e.target.value };
                      return { ...v, optionB: opt };
                    })}
                    placeholder="e.g., Stay at high-paying corporate."
                    className="w-full bg-white border-2 border-stone-900 rounded-none px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#7C3AED] font-medium"
                  />
                  {/* Option B Second-Order Effects */}
                  <div className="space-y-2 pt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-purple-700 font-mono font-black uppercase tracking-wider">LONG-TERM EFFECTS</span>
                      <button 
                        onClick={() => handleAddListItem('decision', 'secondOrderEffects', 'optionB', 'secondOrderEffects')}
                        className="text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-0.5 border border-purple-200 px-1 py-0.5 bg-purple-50 font-bold text-[9px]"
                      >
                        <Plus className="w-2.5 h-2.5 mr-0.5" /> ADD
                      </button>
                    </div>
                    {decisionData.optionB.secondOrderEffects.map((item, id) => (
                      <div key={id} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...decisionData.optionB.secondOrderEffects];
                            updated[id] = e.target.value;
                            setDecisionData(prev => ({
                              ...prev,
                              optionB: { ...prev.optionB, secondOrderEffects: updated }
                            }));
                          }}
                          placeholder="e.g., Financial stability but stagnation in core design skills."
                          className="flex-1 bg-white border-2 border-stone-300 rounded-none px-2 py-1 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                        />
                        {decisionData.optionB.secondOrderEffects.length > 1 && (
                          <button 
                            onClick={() => handleRemoveListItem('decision', 'secondOrderEffects', id, 'optionB', 'secondOrderEffects')}
                            className="text-stone-500 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={!decisionData.coreQuestion.trim()}
                onClick={submitDecisionGuide}
                className="bg-stone-900 hover:bg-[#7C3AED] hover:text-white text-white py-3.5 px-6 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all brutalist-shadow-purple flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-stone-300 disabled:text-stone-500 disabled:border-stone-400 disabled:cursor-not-allowed disabled:shadow-none rounded-none w-full sm:w-auto font-display"
              >
                <span>Weigh with Melvin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Guide 3: Friendly Soundboard */}
        {activeGuide === 'avoidance' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-display font-black tracking-tight text-stone-900 uppercase italic">Gently Overcoming Blocks</h3>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                Identify things you are putting off or finding difficult. Melvin acts as a warm, supportive partner to help you make your plans feel lighter and simpler.
              </p>
            </div>

            <div className="space-y-4 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none text-xs text-stone-900 font-medium">
              {/* Question 1 */}
              <div className="space-y-1.5">
                <label className="font-black text-stone-850 block uppercase tracking-wide text-[10px] text-purple-700">1. What specific task or situation is feeling a bit heavy or that you are putting off?</label>
                <input
                  type="text"
                  value={avoidanceData.thingBeingAvoided}
                  onChange={(e) => setAvoidanceData(p => ({ ...p, thingBeingAvoided: e.target.value }))}
                  placeholder="e.g., Sorting out my desk workspace, or calling a client back..."
                  className="w-full bg-[#FAF7F2] border-2 border-stone-900 rounded-none px-3.5 py-2 text-stone-900 focus:outline-none focus:border-[#7C3AED] font-semibold"
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1.5">
                <label className="font-black text-stone-850 block uppercase tracking-wide text-[10px] text-purple-700">2. What makes this feel a bit daunting or difficult to touch today?</label>
                <textarea
                  value={avoidanceData.whyIsItDifficult}
                  onChange={(e) => setAvoidanceData(p => ({ ...p, whyIsItDifficult: e.target.value }))}
                  placeholder="e.g., I'm a bit tired, or I feel like I might not do a perfect job first try."
                  rows={2}
                  className="w-full bg-[#FAF7F2] border-2 border-stone-900 rounded-none px-3.5 py-2 text-stone-900 focus:outline-none focus:border-[#7C3AED] resize-none font-sans font-semibold"
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-1.5 font-sans">
                <label className="font-black text-stone-850 block uppercase tracking-wide text-[10px] text-purple-700">3. What is a positive detail or peace-of-mind you will feel once it is sorted?</label>
                <input
                  type="text"
                  value={avoidanceData.whatIsAtStake}
                  onChange={(e) => setAvoidanceData(p => ({ ...p, whatIsAtStake: e.target.value }))}
                  placeholder="e.g., Feeling completely calm and clear about the desk setup for tomorrow."
                  className="w-full bg-[#FAF7F2] border-2 border-stone-900 rounded-none px-3.5 py-2 text-stone-900 focus:outline-none focus:border-[#7C3AED] font-semibold"
                />
              </div>

              {/* Question 4 */}
              <div className="space-y-1.5">
                <label className="font-black text-stone-850 block uppercase tracking-wide text-[10px] text-purple-700">4. What is one extremely small, 3-minute action that would make a friendly first start?</label>
                <input
                  type="text"
                  value={avoidanceData.oneSmallAction}
                  onChange={(e) => setAvoidanceData(p => ({ ...p, oneSmallAction: e.target.value }))}
                  placeholder="e.g., Just setting a timer for 3 minutes and holding a single paper."
                  className="w-full bg-[#FAF7F2] border-2 border-stone-900 rounded-none px-3.5 py-2 text-stone-900 focus:outline-none focus:border-[#7C3AED] font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={!avoidanceData.thingBeingAvoided.trim()}
                onClick={submitAvoidanceGuide}
                className="bg-stone-900 hover:bg-[#7C3AED] text-white py-3.5 px-6 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all brutalist-shadow-purple flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-stone-300 disabled:text-stone-500 disabled:border-stone-400 disabled:cursor-not-allowed disabled:shadow-none rounded-none w-full sm:w-auto font-display"
              >
                <span>Commit with Melvin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
