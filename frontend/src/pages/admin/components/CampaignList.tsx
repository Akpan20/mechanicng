import { useState } from 'react';
import { AdCampaign, AdStatus } from '@/types/ads';
import { CampaignRow } from './CampaignRow';

interface CampaignListProps {
  campaigns: AdCampaign[];
  isLoading: boolean;
  advertisersCount: number;
  onNewCampaign: () => void;
  onEdit: (id: string) => void;               // eslint-disable-line no-unused-vars
  onStatusChange: (id: string, status: string) => void; // eslint-disable-line no-unused-vars
  onDelete: (id: string) => void;              // eslint-disable-line no-unused-vars
}

export default function CampaignList({
  campaigns,
  isLoading,
  advertisersCount,
  onEdit,
  onStatusChange,
  onDelete,
  onNewCampaign,
}: CampaignListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCampaigns =
    statusFilter === 'all'
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  const statusOptions = ['all', 'pending', 'active', 'paused', 'rejected', 'expired'] as const;

  const getStatusCount = (status: string) =>
    status === 'all' ? campaigns.length : campaigns.filter((c) => c.status === status).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="loader w-12 h-12" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-500">
        <div className="text-6xl mb-4">📢</div>
        <h3 className="text-xl font-bold mb-3">No campaigns yet</h3>
        <p className="mb-6">
          {advertisersCount === 0
            ? "You need to add at least one advertiser before creating campaigns."
            : "Click the '+ New Campaign' button to create your first campaign."}
        </p>
        {advertisersCount === 0 ? (
          <p className="text-amber-400 text-sm">
            ⚠ Add an advertiser first in the Advertisers tab
          </p>
        ) : (
          <button 
            onClick={onNewCampaign}
            className="text-brand-400 hover:underline"
          >
            Create your first campaign
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              statusFilter === status
                ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            {status === 'all'
              ? `All (${campaigns.length})`
              : `${status.charAt(0).toUpperCase() + status.slice(1)} (${getStatusCount(status)})`}
          </button>
        ))}
      </div>

      {/* Campaign Rows */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <CampaignRow
            key={campaign.id}
            campaign={campaign}
            onEdit={() => onEdit(campaign.id)}
            onStatusChange={(newStatus: AdStatus) => onStatusChange(campaign.id, newStatus)}
            onDelete={() => onDelete(campaign.id)}
          />
        ))}
      </div>
    </div>
  );
}