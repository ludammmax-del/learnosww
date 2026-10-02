import React from 'react';
import { PhoneCall, Bot, CheckSquare, Users, Video, PenTool } from 'lucide-react';
import { PeerPartner } from '../../types.ts';

interface LearningRightDockProps {
  partner?: PeerPartner | null;
  onStartCall: (partner: { name: string; avatar?: string; role: string }) => void;
  onOpenPeer: () => void;
  onOpenWhiteboard?: () => void;
  onOpenChat: () => void;
  onOpenTasks: () => void;
}

export const LearningRightDock: React.FC<LearningRightDockProps> = ({
  partner,
  onStartCall,
  onOpenPeer,
  onOpenWhiteboard,
  onOpenChat,
  onOpenTasks,
}) => {
  const partnerName = partner?.name || 'Напарник';

  return (
    <aside className="w-14 h-full border-l border-[#DADCE0] bg-white hidden md:flex flex-col items-center py-3 justify-between z-40 select-none shrink-0 shadow-none">
      {/* Top Action Icons (AI Operator & Connected Peer in Google Side Panel Style) */}
      <div className="flex flex-col items-center space-y-2">
        {/* AI Operator Quick Avatar */}
        <button
          type="button"
          data-action="open_chat"
          className="relative w-10 h-10 rounded-full text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F1F3F4] flex items-center justify-center transition-colors cursor-pointer group"
          onClick={onOpenChat}
          title="ИИ-Оператор: персональный тьютор и фасилитатор"
        >
          <Bot className="w-5 h-5 text-[#1A73E8]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1E8E3E] ring-2 ring-white" />
        </button>

        {/* P2P Partner Slot: Displays active partner or invite shortcut */}
        {partner ? (
          <div
            data-action="start_call"
            className="relative group cursor-pointer"
            onClick={() =>
              onStartCall({
                name: partnerName,
                avatar: partner.avatar,
                role: `Напарник (${partner.skillDomain || 'P2P'})`,
              })
            }
            title={`${partnerName} • Нажмите для видеозвонка`}
          >
            {partner.avatar ? (
              <img
                src={partner.avatar}
                alt={partnerName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#1E8E3E]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-semibold flex items-center justify-center text-xs ring-2 ring-[#1A73E8]/40">
                {partnerName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#1E8E3E] ring-2 ring-white" />
          </div>
        ) : (
          <button
            type="button"
            data-action="open_peer"
            className="w-10 h-10 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] flex items-center justify-center transition-colors cursor-pointer"
            onClick={onOpenPeer}
            title="P2P Коллаборация: подключить напарника"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-[#DADCE0]" />

      {/* Bottom Action Shortcuts (Google Sidepanel Style) */}
      <div className="flex flex-col items-center space-y-2">
        {/* Interactive Whiteboard Shortcut */}
        {onOpenWhiteboard && (
          <button
            type="button"
            data-action="open_whiteboard"
            onClick={onOpenWhiteboard}
            className="w-10 h-10 rounded-full text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F1F3F4] flex items-center justify-center transition-colors cursor-pointer"
            title="Интерактивная доска (Белый экран)"
          >
            <PenTool className="w-4 h-4" />
          </button>
        )}

        {/* P2P Video Call Trigger */}
        <button
          type="button"
          data-action="start_call"
          onClick={() => {
            if (partner) {
              onStartCall({
                name: partnerName,
                avatar: partner.avatar,
                role: partner.skillDomain || 'Напарник',
              });
            } else {
              onOpenPeer();
            }
          }}
          className="w-10 h-10 rounded-full text-[#5F6368] hover:text-[#1E8E3E] hover:bg-[#F1F3F4] flex items-center justify-center transition-colors cursor-pointer"
          title={partner ? `Позвонить ${partnerName}` : 'P2P Видеозвонок'}
        >
          <PhoneCall className="w-4 h-4" />
        </button>

        {/* Active Tasks Shortcut */}
        <button
          type="button"
          data-action="open_tasks"
          onClick={onOpenTasks}
          className="w-10 h-10 rounded-full text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F1F3F4] flex items-center justify-center transition-colors cursor-pointer"
          title="Задачи текущего спринта"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
