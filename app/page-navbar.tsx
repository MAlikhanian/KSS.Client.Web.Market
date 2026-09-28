'use client';

import { Navbar } from '@/partials/navbar/navbar';
import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { useTranslation } from 'react-i18next';

const PageNavbar = () => {
  const { settings } = useSettings();
  const { t } = useTranslation();

  const items = [
    { title: t('menu.marketAssets', { defaultValue: 'Assets' }), path: '/market/assets' },
    { title: t('menu.marketSectors', { defaultValue: 'Sectors' }), path: '/market/sectors' },
    { title: t('menu.marketAssetTypes', { defaultValue: 'Asset Types' }), path: '/market/asset-types' },
    { title: t('menu.marketTypes', { defaultValue: 'Market Types' }), path: '/market/market-types' },
  ];

  if (settings?.layout === 'demo1') {
    return (
      <Navbar>
        <Container>
          <NavbarMenu items={items} />
        </Container>
      </Navbar>
    );
  }
  return <></>;
};

export { PageNavbar };
