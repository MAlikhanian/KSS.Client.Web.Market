'use client';

import { SimpleEntityContent } from '@/app/components/simple-entity-content';
import { MarketSidebar } from '@/app/components/market-sidebar';

export function AssetTypesContent() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 lg:gap-7.5">
      <div className="col-span-3">
        <div className="grid gap-5 lg:gap-7.5">
          <SimpleEntityContent
            namespace="market-asset-type"
            listEndpoint="/api/market/asset-type"
            translationEndpoint="/api/market/asset-type/translation"
            fkField="assetTypeId"
            badgeColor="purple"
          />
        </div>
      </div>
      <div className="col-span-1">
        <div className="grid gap-5 lg:gap-7.5">
          <MarketSidebar />
        </div>
      </div>
    </div>
  );
}
