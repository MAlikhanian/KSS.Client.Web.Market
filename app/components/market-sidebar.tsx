'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { TrendingUp, Layers, Tag, BarChart3 } from 'lucide-react';

interface MarketSidebarProps {
  itemCount?: number;
}

export function MarketSidebar({ itemCount = 0 }: MarketSidebarProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('marketSidebar.title', { defaultValue: 'Market Cardex' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('marketSidebar.totalItems', { defaultValue: 'Total Items' })}
              </p>
              <p className="text-xs text-muted-foreground">{itemCount.toLocaleString(locale)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('marketSidebar.activeItems', { defaultValue: 'Active' })}
              </p>
              <p className="text-xs text-muted-foreground">-</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Layers className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('marketSidebar.lastUpdated', { defaultValue: 'Last Updated' })}
              </p>
              <p className="text-xs text-muted-foreground">-</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Tag className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('marketSidebar.status', { defaultValue: 'Status' })}
              </p>
              <p className="text-xs text-muted-foreground">-</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
