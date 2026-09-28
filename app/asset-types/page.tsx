'use client';

import { Fragment } from 'react';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { AssetTypesContent } from './content';
import { PageNavbar } from '@/app/page-navbar';
import { useTranslation } from '@/hooks/useTranslation';

export default function AssetTypesPage() {
  const { settings } = useSettings();
  const { t } = useTranslation('market-asset-type');

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text={t('pageTitle', { defaultValue: 'Asset Types' })} />
              <ToolbarDescription>
                {t('toolbar.description', { defaultValue: 'Manage asset types' })}
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AssetTypesContent />
      </Container>
    </Fragment>
  );
}
