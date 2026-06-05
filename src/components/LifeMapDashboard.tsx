import React, { useState } from 'react';
import { 
  LifeMap, 
  LifeMapObservation, 
  TimelineEntry, 
  UnfinishedThread 
} from '../types';
import { 
  Brain, 
  Target, 
  Users, 
  Briefcase, 
  Zap, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Heart, 
  Sparkles, 
  Clock, 
  ListTodo, 
  Loader2, 
  CheckCircle2, 
  MessageSquareOff, 
  LineChart,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  Award
} from 'lucide-react';

interface LifeMapDashboardProps {
  lifeMap: LifeMap;
  isUpdating: boolean;
  onManualRefresh: () => void;
}

export default function LifeMapDashboard({ 
  lifeMap, 
  isUpdating, 
  onManualRefresh 
}: LifeMapDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'threads'>('profile');

  const { profile, unfinishedThreads } = lifeMap;

  // Helper to count how many fields are populated to show a completeness score
  const getCompletenessVal = () => {
    let totalFields = 0;
    let populatedFields = 0;
    
    Object.values(profile).forEach(arr => {
      totalFields += 1;
      if (arr && arr.length > 0) populatedFields += 1;
    });

    if (unfinishedThreads && unfinishedThreads.length > 0) {
      totalFields += 1;
      populatedFields += 1;
    }

    if (totalFields === 0) return 0;
    return Math.round((populatedFields / totalFields) * 100);
  };

  const completeness = getCompletenessVal();

  return (
    <div className="bg-white border-4 border-stone-900 brutalist-shadow rounded-none overflow-hidden font-sans flex flex-col h-[650px] relative">
      {/* Dashboard Top Banner */}
      <div className="p-4 bg-stone-900 text-white border-b-4 border-stone-900 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-1 px-1.5 bg-purple-700 text-white border border-stone-700">
            <Brain className="w-5 h-5 text-purple-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-display font-black text-white tracking-widest uppercase text-sm italic">My Life Map</span>
              <span className="font-mono text-[9px] bg-purple-950 border border-purple-500 text-purple-300 font-extrabold px-1.5 py-0.2 uppercase rounded-none">
                Persistent Engine
              </span>
            </div>
            <p className="font-mono text-[9px] text-stone-300">
              {isUpdating ? 'Extracting Melvin cognitive insights...' : 'Melvin perspective synchronized'}
            </p>
          </div>
        </div>

        <button 
          onClick={onManualRefresh}
          disabled={isUpdating}
          className="p-1.5 bg-stone-800 border-2 border-stone-700 hover:border-purple-500 hover:text-purple-300 text-stone-350 cursor-pointer transition-all rounded-none flex items-center space-x-1 font-mono text-[9.5px] font-bold uppercase"
          title="Analyze conversation history to rebuild Life Map"
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span>Refresh Map</span>
        </button>
      </div>

      {/* Completeness bar */}
      <div className="bg-[#FAF7F2] p-3 px-4 border-b-2 border-stone-900 flex justify-between items-center text-xs font-mono shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-black text-stone-900 text-[10px] uppercase tracking-wider">Sync Completeness:</span>
          <div className="w-24 md:w-36 bg-stone-200 border border-stone-900 h-3 rounded-none overflow-hidden relative">
            <div 
              className="bg-purple-600 h-full transition-all duration-500" 
              style={{ width: `${completeness}%` }}
            />
          </div>
          <span className="font-extrabold text-[11px] text-purple-800">{completeness}%</span>
        </div>
        <p className="text-[10px] text-stone-605 italic hidden md:block">
          *Deeper conversations yield finer maps.
        </p>
      </div>

      {/* Brutalist Styling Tab Bar */}
      <div className="flex border-b-2 border-stone-900 bg-[#E8E4DE] shrink-0 text-xs font-mono">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 text-center border-r-2 border-stone-900 font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'profile' ? 'bg-purple-700 text-white' : 'bg-transparent text-stone-800 hover:bg-[#FAF7F2]'
          }`}
        >
          Profile Facts
        </button>
        <button
          onClick={() => setActiveTab('threads')}
          className={`flex-1 py-3 text-center font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'threads' ? 'bg-purple-700 text-white' : 'bg-transparent text-stone-800 hover:bg-[#FAF7F2]'
          }`}
        >
          Unfinished Threads
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto bg-[#FAF7F2] p-4 font-sans">
        
        {/* Profile Facts Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="border border-stone-200 bg-white p-3 brutalist-shadow-sm flex items-center space-x-2 text-stone-700">
              <span className="p-1.5 bg-purple-50 border border-purple-200"><TrendingUp className="w-4 h-4 text-purple-700" /></span>
              <p className="text-xs font-semibold leading-normal">
                These factual clusters are Melvin's long-term baseline. He aggregates goals, fears, and assumptions automatically as they shift.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Category Goals */}
              <div className="bg-white p-4 border-2 border-stone-900 brutalist-shadow-sm text-xs">
                <div className="flex items-center space-x-2 border-b border-stone-200 pb-1.5 mb-2.5">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="font-mono font-black uppercase tracking-wider text-stone-900">Core Goals</span>
                </div>
                {profile.goals.length === 0 ? (
                  <p className="text-stone-500 italic">No stated goals extracted yet.</p>
                ) : (
                  <ul className="space-y-2 font-medium text-stone-800">
                    {profile.goals.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1.5 text-orange-600 select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Category Fears */}
              <div className="bg-white p-4 border-2 border-stone-900 brutalist-shadow-sm text-xs">
                <div className="flex items-center space-x-2 border-b border-stone-200 pb-1.5 mb-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span className="font-mono font-black uppercase tracking-wider text-stone-900">Core Fears & Avoidances</span>
                </div>
                {profile.fears.length === 0 ? (
                  <p className="text-stone-500 italic">No fears mapped yet.</p>
                ) : (
                  <ul className="space-y-2 font-medium text-stone-800">
                    {profile.fears.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1.5 text-rose-600 select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Category Career */}
              <div className="bg-white p-4 border-2 border-stone-900 brutalist-shadow-sm text-xs">
                <div className="flex items-center space-x-2 border-b border-stone-200 pb-1.5 mb-2.5">
                  <Briefcase className="w-4 h-4 text-purple-700" />
                  <span className="font-mono font-black uppercase tracking-wider text-stone-900">Work & Alignment Focus</span>
                </div>
                {profile.career.length === 0 ? (
                  <p className="text-stone-500 italic">No professional alignments tracked yet.</p>
                ) : (
                  <ul className="space-y-2 font-medium text-stone-800">
                    {profile.career.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1.5 text-purple-600 select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Category Relationships */}
              <div className="bg-white p-4 border-2 border-stone-900 brutalist-shadow-sm text-xs">
                <div className="flex items-center space-x-2 border-b border-stone-200 pb-1.5 mb-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-mono font-black uppercase tracking-wider text-stone-900">Relationships Map</span>
                </div>
                {profile.relationships.length === 0 ? (
                  <p className="text-stone-500 italic">No key relationships mapped.</p>
                ) : (
                  <ul className="space-y-2 font-medium text-stone-800">
                    {profile.relationships.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1.5 text-blue-600 select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Category Beliefs */}
              <div className="bg-white p-4 border-2 border-stone-900 brutalist-shadow-sm text-xs">
                <div className="flex items-center space-x-2 border-b border-stone-200 pb-1.5 mb-2.5">
                  <AlertTriangle className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono font-black uppercase tracking-wider text-stone-900">Core Beliefs</span>
                </div>
                {profile.beliefs.length === 0 ? (
                  <p className="text-stone-500 italic">No beliefs documented yet.</p>
                ) : (
                  <ul className="space-y-2 font-medium text-stone-800">
                    {profile.beliefs.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1.5 text-emerald-600 select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Category Blind Spots */}
              <div className="bg-white p-4 border-2 border-stone-900 brutalist-shadow-sm text-xs">
                <div className="flex items-center space-x-2 border-b border-stone-200 pb-1.5 mb-2.5">
                  <Flame className="w-4 h-4 text-purple-650 text-indigo-700" />
                  <span className="font-mono font-black uppercase tracking-wider text-stone-900">Melvin Detected Blind Spots</span>
                </div>
                {profile.blind_spots.length === 0 ? (
                  <p className="text-stone-500 italic">Melvin hasn't detected specific blind spots yet.</p>
                ) : (
                  <ul className="space-y-2 font-medium text-stone-800">
                    {profile.blind_spots.map((item, idx) => (
                      <li key={idx} className="flex items-start bg-indigo-50 border border-indigo-150 p-1.5 border-dashed">
                        <span className="mr-1.5 text-indigo-750 font-black">!</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Unfinished Threads Tab */}
        {activeTab === 'threads' && (
          <div className="space-y-4">
            <div className="border border-stone-200 bg-white p-3 brutalist-shadow-sm flex items-center space-x-2 text-stone-700">
              <span className="p-1.5 bg-amber-50 border border-amber-200"><CheckCircle2 className="w-4 h-4 text-amber-600" /></span>
              <p className="text-xs font-semibold leading-normal">
                Unresolved Conversations: Tension zones or open topics. If a conversation is cut short, Melvin files it here to follow up later.
              </p>
            </div>

            {unfinishedThreads.filter(t => t.status === 'open').length === 0 ? (
              <div className="bg-white border-2 border-stone-900 p-8 text-center text-stone-500 font-medium text-xs space-y-2 brutalist-shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto animate-bounce" />
                <p className="font-black text-stone-900 uppercase">All topics clear and fully processed!</p>
                <p className="text-[10px] font-mono text-stone-400">Everything we discussed reached a logical checkpoint.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {unfinishedThreads.filter(t => t.status === 'open').slice().reverse().map((th) => (
                  <div 
                    key={th.id}
                    className="p-4 bg-white border-2 border-stone-900 brutalist-shadow-sm space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center border-b border-stone-200 pb-1.5">
                      <span className="font-extrabold uppercase text-stone-900">Topic: {th.topic}</span>
                      <span className="text-[9px] bg-amber-100 text-amber-950 font-black px-1.5 py-0.5 border border-amber-300 uppercase tracking-wider font-mono">
                        OPEN THREAD
                      </span>
                    </div>
                    
                    <p className="text-stone-700 leading-normal font-medium bg-stone-50 p-2 border border-dashed border-stone-300">
                      <span className="font-mono text-[9px] uppercase font-bold text-stone-400 block mb-0.5">CONTEXT NOTE:</span>
                      {th.context}
                    </p>

                    <div className="space-y-1">
                      <span className="font-mono text-[9px] uppercase font-black text-purple-700 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Melvin's Next Check-in Prompt Idea:
                      </span>
                      <p className="italic text-stone-900 leading-relaxed font-semibold">
                        "{th.triggerQuestion}"
                      </p>
                    </div>

                    <span className="font-mono text-[9px] uppercase font-bold text-stone-400 block pt-1">
                      Discovered: {th.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
