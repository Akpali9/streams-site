import React from 'react';
import type { UserPresence } from '../../lib/supabase';

interface UserPresenceIndicatorProps {
  presence: UserPresence | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  presence,
  showLabel = false,
  size = 'md',
}) => {
  if (!presence) return null;

  const sizeClass = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[size];

  const statusColor = presence.is_online ? 'bg-green-500' : 'bg-gray-400';
  const statusText = presence.is_online ? 'Online' : 'Offline';

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClass} rounded-full ${statusColor} animate-pulse`}></div>
      {showLabel && <span className="text-sm text-gray-600">{statusText}</span>}
    </div>
  );
};

interface PresenceBadgeProps {
  isOnline: boolean;
  userName?: string;
}

export const PresenceBadge: React.FC<PresenceBadgeProps> = ({ isOnline, userName }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      ></div>
      <span className="text-sm font-medium text-gray-700">
        {userName || (isOnline ? 'Online' : 'Offline')}
      </span>
    </div>
  );
};
