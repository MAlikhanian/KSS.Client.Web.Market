'use client';

import { SimpleEntityContent } from '@/app/components/simple-entity-content';
import { MarketSidebar } from '@/app/components/market-sidebar';

export function MarketTypesContent() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 lg:gap-7.5">
      <div className="col-span-3">
        <div className="grid gap-5 lg:gap-7.5">
          <SimpleEntityContent
            namespace="market-type"
            listEndpoint="/api/market/market-type"
            translationEndpoint="/api/market/market-type/translation"
            fkField="marketTypeId"
            badgeColor="indigo"
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
