import { Advertiser, AdCampaign } from '@/types/ads'
import AdvertiserCard from './AdvertiserCard'

interface AdvertiserListProps {
  advertisers: Advertiser[]
  isLoading: boolean
  campaigns: AdCampaign[]
  onDelete: (id: string) => void  // eslint-disable-line no-unused-vars
}

export default function AdvertiserList({
  advertisers,
  isLoading,
  campaigns,
  onDelete,
}: AdvertiserListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="loader w-12 h-12" />
      </div>
    )
  }

  if (advertisers.length === 0) {
    return (
      <div className="card text-center py-16 text-gray-500">
        <div className="text-6xl mb-4">🏢</div>
        <h3 className="text-xl font-bold mb-3">No advertisers yet</h3>
        <p className="mb-4">
          Add your first advertiser to start creating campaigns.
        </p>
        <p className="text-sm text-gray-600">
          Advertisers are required before you can run any paid campaigns.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {advertisers.map(adv => {
        const campaignCount = campaigns.filter(c => c.advertiser_id === adv.id).length
        return (
          <AdvertiserCard
            key={adv.id}
            advertiser={adv}
            campaignCount={campaignCount}
            onDelete={() => onDelete(adv.id)}
          />
        )
      })}
    </div>
  )
}