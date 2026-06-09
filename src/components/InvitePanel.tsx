/**
 * InvitePanel.tsx
 * Shows user their invite links and remaining invites.
 * Melvin-voiced copy throughout.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createInvite, getInvitesRemaining, getUserInvites, InviteRecord } from '../inviteService';
import { Copy, Check, Users } from 'lucide-react';

interface InvitePanelProps {
  uid: string;
  displayName: string;
  onClose: () => void;
}

export default function InvitePanel({ uid, displayName, onClose }: InvitePanelProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [rem, inv] = await Promise.all([
      getInvitesRemaining(uid),
      getUserInvites(uid),
    ]);
    setRemaining(rem);
    setInvites(inv);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (remaining <= 0) return;
    setCreating(true);
    await createInvite(uid, displayName || 'someone');
    await load();
    setCreating(false);
  };

  const getInviteUrl = (token: string) =>
    `${window.location.origin}?invite=${token}`;

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const unusedInvites = invites.filter(i => !i.used);
  const usedInvites = invites.filter(i => i.used);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-stone-950 border-4 border-stone-800 max-w-md w-full"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-stone-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h2 className="text-white font-black text-sm uppercase tracking-tight font-mono">Introductions</h2>
            </div>
            <p className="text-stone-500 text-[9px] font-mono uppercase tracking-wider mt-0.5">
              The only way in is through you.
            </p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors cursor-pointer font-mono text-[10px] uppercase tracking-wider border border-stone-800 px-2.5 py-1 hover:border-stone-600">
            Close
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {loading ? (
            <p className="text-stone-500 font-mono text-[10px] uppercase tracking-wider animate-pulse">Loading...</p>
          ) : (
            <>
              {/* Remaining invites */}
              <div className="bg-stone-900 border border-stone-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400">
                    Introductions remaining
                  </p>
                  <span className={`text-2xl font-black font-mono ${remaining > 0 ? 'text-purple-400' : 'text-stone-600'}`}>
                    {remaining}
                  </span>
                </div>
                <p className="text-[9px] text-stone-500 leading-snug">
                  {remaining > 0
                    ? "Each person you introduce gets their own Melvin and 3 introductions of their own."
                    : "You're out of introductions for now. More may become available over time."
                  }
                </p>
              </div>

              {/* Create new invite */}
              {remaining > 0 && (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-3 bg-[#7C3AED] hover:bg-purple-600 text-white font-mono font-black text-[10px] uppercase tracking-widest border border-purple-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create introduction link'}
                </button>
              )}

              {/* Active invite links */}
              {unusedInvites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-mono font-black uppercase tracking-wider text-stone-500">
                    Active links
                  </p>
                  {unusedInvites.map(invite => (
                    <div key={invite.token} className="flex items-center gap-2 bg-stone-900 border border-stone-800 px-3 py-2">
                      <p className="flex-1 text-[10px] font-mono text-stone-300 truncate">
                        {getInviteUrl(invite.token)}
                      </p>
                      <button
                        onClick={() => copyLink(invite.token)}
                        className="shrink-0 p-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedToken === invite.token
                          ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Used invites */}
              {usedInvites.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-mono font-black uppercase tracking-wider text-stone-600">
                    {usedInvites.length} introduction{usedInvites.length !== 1 ? 's' : ''} accepted
                  </p>
                </div>
              )}

              <p className="text-[9px] text-stone-600 font-mono leading-relaxed border-t border-stone-800 pt-4">
                When someone signs up with your link, Melvin will tell them you introduced them. "I hear you know [your name]. Good taste." That's the whole marketing strategy.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
