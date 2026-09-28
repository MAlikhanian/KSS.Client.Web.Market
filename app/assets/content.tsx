'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';
import { localizeDigits } from '@/app/components/person/format-utils';
import { MarketSidebar } from '../components/market-sidebar';

const FA_LANG = 12;
const EN_LANG = 10;

interface AssetRow {
  id: string;
  marketTypeId: number;
  assetTypeId: number;
  sectorId?: number | null;
  symbol: string;
  instrumentCode?: string | null;
  collateralFactor?: number | null;
  isActive: boolean;
  isDelisted: boolean;
}

interface SimpleTr {
  marketTypeId?: number;
  assetTypeId?: number;
  sectorId?: number;
  languageId: number;
  name: string;
}

interface AssetTr {
  assetId: string;
  languageId: number;
  name: string;
  shortName?: string | null;
}

interface ReferenceData {
  marketTypeTranslations: SimpleTr[];
  assetTypeTranslations: SimpleTr[];
  sectorTranslations: SimpleTr[];
  assetTranslations: AssetTr[];
}

export function AssetsContent() {
  const { t, i18n } = useTranslation('market-asset');
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US';
  const langId = i18n.language === 'fa' ? FA_LANG : EN_LANG;

  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [reference, setReference] = useState<ReferenceData>({
    marketTypeTranslations: [],
    assetTypeTranslations: [],
    sectorTranslations: [],
    assetTranslations: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formMarketTypeId, setFormMarketTypeId] = useState<number>(0);
  const [formAssetTypeId, setFormAssetTypeId] = useState<number>(0);
  const [formSectorId, setFormSectorId] = useState<number | null>(null);
  const [formSymbol, setFormSymbol] = useState('');
  const [formInstrumentCode, setFormInstrumentCode] = useState('');
  const [formCollateralFactor, setFormCollateralFactor] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDelisted, setFormIsDelisted] = useState(false);
  const [formNameFa, setFormNameFa] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formShortNameFa, setFormShortNameFa] = useState('');
  const [formShortNameEn, setFormShortNameEn] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    toast.custom(
      () => (
        <Alert variant="mono" icon={type === 'success' ? 'success' : 'destructive'}>
          <AlertIcon>
            {type === 'success' ? <RiCheckboxCircleFill /> : <RiErrorWarningFill />}
          </AlertIcon>
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      ),
      { position: 'top-center' },
    );
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsRes, refRes] = await Promise.all([
        fetch('/market/api/market/asset', { cache: 'no-store' }),
        fetch('/market/api/market/reference', { cache: 'no-store' }),
      ]);
      if (!assetsRes.ok) throw new Error('assets');
      if (!refRes.ok) throw new Error('reference');
      const assetsData = await assetsRes.json();
      const refData = await refRes.json();
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setReference({
        marketTypeTranslations: Array.isArray(refData.marketTypeTranslations) ? refData.marketTypeTranslations : [],
        assetTypeTranslations: Array.isArray(refData.assetTypeTranslations) ? refData.assetTypeTranslations : [],
        sectorTranslations: Array.isArray(refData.sectorTranslations) ? refData.sectorTranslations : [],
        assetTranslations: Array.isArray(refData.assetTranslations) ? refData.assetTranslations : [],
      });
    } catch {
      showToast(t('loadFailed', { defaultValue: 'Failed to load data' }), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build option lists from translations
  const marketTypeOptions = useMemo(() => {
    const seen = new Set<number>();
    const opts: Array<{ id: number; label: string }> = [];
    for (const tr of reference.marketTypeTranslations) {
      if (tr.marketTypeId == null || seen.has(tr.marketTypeId)) continue;
      // Prefer the row in the current ui language; fall back to any row
      const match = reference.marketTypeTranslations.find(
        (x) => x.marketTypeId === tr.marketTypeId && x.languageId === langId,
      ) ?? tr;
      seen.add(tr.marketTypeId);
      opts.push({ id: tr.marketTypeId, label: match.name });
    }
    return opts.sort((a, b) => a.id - b.id);
  }, [reference.marketTypeTranslations, langId]);

  const assetTypeOptions = useMemo(() => {
    const seen = new Set<number>();
    const opts: Array<{ id: number; label: string }> = [];
    for (const tr of reference.assetTypeTranslations) {
      if (tr.assetTypeId == null || seen.has(tr.assetTypeId)) continue;
      const match = reference.assetTypeTranslations.find(
        (x) => x.assetTypeId === tr.assetTypeId && x.languageId === langId,
      ) ?? tr;
      seen.add(tr.assetTypeId);
      opts.push({ id: tr.assetTypeId, label: match.name });
    }
    return opts.sort((a, b) => a.id - b.id);
  }, [reference.assetTypeTranslations, langId]);

  const sectorOptions = useMemo(() => {
    const seen = new Set<number>();
    const opts: Array<{ id: number; label: string }> = [];
    for (const tr of reference.sectorTranslations) {
      if (tr.sectorId == null || seen.has(tr.sectorId)) continue;
      const match = reference.sectorTranslations.find(
        (x) => x.sectorId === tr.sectorId && x.languageId === langId,
      ) ?? tr;
      seen.add(tr.sectorId);
      opts.push({ id: tr.sectorId, label: match.name });
    }
    return opts.sort((a, b) => a.id - b.id);
  }, [reference.sectorTranslations, langId]);

  const getAssetName = useCallback(
    (assetId: string, lang: number) => {
      const tr = reference.assetTranslations.find(
        (x) => x.assetId?.toLowerCase() === assetId.toLowerCase() && x.languageId === lang,
      );
      return tr?.name || '';
    },
    [reference.assetTranslations],
  );

  const getAssetShortName = useCallback(
    (assetId: string, lang: number) => {
      const tr = reference.assetTranslations.find(
        (x) => x.assetId?.toLowerCase() === assetId.toLowerCase() && x.languageId === lang,
      );
      return tr?.shortName || '';
    },
    [reference.assetTranslations],
  );

  const getMarketTypeName = (id: number) =>
    marketTypeOptions.find((o) => o.id === id)?.label || String(id);
  const getAssetTypeName = (id: number) =>
    assetTypeOptions.find((o) => o.id === id)?.label || String(id);
  const getSectorName = (id?: number | null) =>
    id == null ? t('noSector', { defaultValue: '—' }) : sectorOptions.find((o) => o.id === id)?.label || String(id);

  const filteredAssets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assets;
    return assets.filter((a) => {
      if (a.symbol?.toLowerCase().includes(term)) return true;
      if (a.instrumentCode?.toLowerCase().includes(term)) return true;
      if (getAssetName(a.id, FA_LANG).toLowerCase().includes(term)) return true;
      if (getAssetName(a.id, EN_LANG).toLowerCase().includes(term)) return true;
      return false;
    });
  }, [assets, searchTerm, getAssetName]);

  const resetForm = () => {
    setEditingId(null);
    setFormMarketTypeId(marketTypeOptions[0]?.id ?? 0);
    setFormAssetTypeId(assetTypeOptions[0]?.id ?? 0);
    setFormSectorId(null);
    setFormSymbol('');
    setFormInstrumentCode('');
    setFormCollateralFactor('');
    setFormIsActive(true);
    setFormIsDelisted(false);
    setFormNameFa('');
    setFormNameEn('');
    setFormShortNameFa('');
    setFormShortNameEn('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: AssetRow) => {
    setEditingId(row.id);
    setFormMarketTypeId(row.marketTypeId);
    setFormAssetTypeId(row.assetTypeId);
    setFormSectorId(row.sectorId ?? null);
    setFormSymbol(row.symbol);
    setFormInstrumentCode(row.instrumentCode ?? '');
    setFormCollateralFactor(row.collateralFactor != null ? String(row.collateralFactor) : '');
    setFormIsActive(row.isActive);
    setFormIsDelisted(row.isDelisted);
    setFormNameFa(getAssetName(row.id, FA_LANG));
    setFormNameEn(getAssetName(row.id, EN_LANG));
    setFormShortNameFa(getAssetShortName(row.id, FA_LANG));
    setFormShortNameEn(getAssetShortName(row.id, EN_LANG));
    setDialogOpen(true);
  };

  const upsertTranslation = async (
    assetId: string,
    languageId: number,
    name: string,
    shortName: string,
  ) => {
    const existing = reference.assetTranslations.find(
      (x) => x.assetId?.toLowerCase() === assetId.toLowerCase() && x.languageId === languageId,
    );
    const body = {
      assetId,
      languageId,
      name,
      shortName: shortName || null,
    };
    const method = existing ? 'PUT' : 'POST';
    const res = await fetch('/market/api/market/asset/translation', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'translation');
    }
  };

  const handleSave = async () => {
    if (!formSymbol.trim() || !formMarketTypeId || !formAssetTypeId) {
      showToast(t('saveFailed', { defaultValue: 'Save failed' }), 'error');
      return;
    }
    setSaving(true);
    try {
      let assetId: string;
      const payload: Record<string, unknown> = {
        marketTypeId: formMarketTypeId,
        assetTypeId: formAssetTypeId,
        sectorId: formSectorId,
        symbol: formSymbol.trim(),
        instrumentCode: formInstrumentCode.trim() || null,
        collateralFactor: formCollateralFactor !== '' ? parseFloat(formCollateralFactor) : null,
        isActive: formIsActive,
        isDelisted: formIsDelisted,
      };

      if (editingId !== null) {
        const res = await fetch('/market/api/market/asset', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'update');
        }
        assetId = editingId;
      } else {
        const res = await fetch('/market/api/market/asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'add');
        }
        const created = await res.json();
        assetId = created.id;
      }

      // Upsert translations (skip empty names)
      if (formNameFa.trim()) {
        await upsertTranslation(assetId, FA_LANG, formNameFa.trim(), formShortNameFa.trim());
      }
      if (formNameEn.trim()) {
        await upsertTranslation(assetId, EN_LANG, formNameEn.trim(), formShortNameEn.trim());
      }

      showToast(
        editingId !== null
          ? t('updated', { defaultValue: 'Updated' })
          : t('added', { defaultValue: 'Added' }),
        'success',
      );
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      showToast(
        error instanceof Error && error.message
          ? error.message
          : t('saveFailed', { defaultValue: 'Save failed' }),
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AssetRow) => {
    try {
      const res = await fetch('/market/api/market/asset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'delete');
      }
      showToast(t('deleted', { defaultValue: 'Deleted' }), 'error');
      await loadData();
    } catch (error) {
      showToast(
        error instanceof Error && error.message
          ? error.message
          : t('saveFailed', { defaultValue: 'Save failed' }),
        'error',
      );
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 lg:gap-7.5">
      <div className="col-span-3">
        <div className="grid gap-5 lg:gap-7.5">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-bold"></span>
          {t('pageTitle', { defaultValue: 'Assets' })}
          <Badge variant="outline">{assets.length.toLocaleString(locale)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search', { defaultValue: 'Search by symbol or name' })}
                className="pl-9"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 ml-1" />
              {t('common:add', { defaultValue: 'Add' })}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('common:loading', { defaultValue: 'Loading...' })}
            </p>
          ) : filteredAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noItems', { defaultValue: 'No items' })}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t('symbol', { defaultValue: 'Symbol' })}</TableHead>
                  <TableHead>{langId === FA_LANG ? t('nameFa', { defaultValue: 'Persian Name' }) : t('nameEn', { defaultValue: 'English Name' })}</TableHead>
                  <TableHead>{t('marketType', { defaultValue: 'Market Type' })}</TableHead>
                  <TableHead>{t('assetType', { defaultValue: 'Asset Type' })}</TableHead>
                  <TableHead>{t('sector', { defaultValue: 'Sector' })}</TableHead>
                  <TableHead>{t('collateralFactor', { defaultValue: 'Collateral Factor' })}</TableHead>
                  <TableHead>{t('isActive', { defaultValue: 'Active' })}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{localizeDigits(`${index + 1}`, locale)}</TableCell>
                    <TableCell className="font-mono">{row.symbol}</TableCell>
                    <TableCell>{getAssetName(row.id, langId) || '—'}</TableCell>
                    <TableCell>{getMarketTypeName(row.marketTypeId)}</TableCell>
                    <TableCell>{getAssetTypeName(row.assetTypeId)}</TableCell>
                    <TableCell>{getSectorName(row.sectorId)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.collateralFactor != null ? row.collateralFactor.toFixed(4) : '—'}
                    </TableCell>
                    <TableCell>
                      {row.isDelisted ? (
                        <Badge variant="destructive">
                          {t('isDelisted', { defaultValue: 'Delisted' })}
                        </Badge>
                      ) : row.isActive ? (
                        <Badge variant="success">
                          {t('isActive', { defaultValue: 'Active' })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">—</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId !== null
                  ? t('editDialog', { defaultValue: 'Edit Asset' })
                  : t('addDialog', { defaultValue: 'Add Asset' })}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Market Type */}
              <div className="space-y-2">
                <Label>
                  {t('marketType', { defaultValue: 'Market Type' })}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(formMarketTypeId || '')}
                  onValueChange={(v) => setFormMarketTypeId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {marketTypeOptions.map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Asset Type */}
              <div className="space-y-2">
                <Label>
                  {t('assetType', { defaultValue: 'Asset Type' })}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(formAssetTypeId || '')}
                  onValueChange={(v) => setFormAssetTypeId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypeOptions.map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector */}
              <div className="space-y-2 md:col-span-2">
                <Label>{t('sector', { defaultValue: 'Sector' })}</Label>
                <Select
                  value={formSectorId == null ? '__none__' : String(formSectorId)}
                  onValueChange={(v) =>
                    setFormSectorId(v === '__none__' ? null : Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t('noSector', { defaultValue: '—' })}
                    </SelectItem>
                    {sectorOptions.map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol */}
              <div className="space-y-2">
                <Label>
                  {t('symbol', { defaultValue: 'Symbol' })}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  maxLength={30}
                />
              </div>

              {/* Instrument Code */}
              <div className="space-y-2">
                <Label>{t('instrumentCode', { defaultValue: 'Instrument Code' })}</Label>
                <Input
                  value={formInstrumentCode}
                  onChange={(e) => setFormInstrumentCode(e.target.value)}
                  maxLength={50}
                  dir="ltr"
                />
              </div>

              {/* Collateral Factor */}
              <div className="space-y-2">
                <Label>{t('collateralFactor', { defaultValue: 'Collateral Factor' })}</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.0001}
                  value={formCollateralFactor}
                  onChange={(e) => setFormCollateralFactor(e.target.value)}
                  placeholder="0.0000 – 1.0000"
                  dir="ltr"
                />
              </div>

              {/* Persian Name */}
              <div className="space-y-2">
                <Label>{t('nameFa', { defaultValue: 'Persian Name' })}</Label>
                <Input
                  value={formNameFa}
                  onChange={(e) => setFormNameFa(e.target.value)}
                  maxLength={200}
                  dir="rtl"
                />
              </div>

              {/* English Name */}
              <div className="space-y-2">
                <Label>{t('nameEn', { defaultValue: 'English Name' })}</Label>
                <Input
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  maxLength={200}
                  dir="ltr"
                />
              </div>

              {/* Persian Short Name */}
              <div className="space-y-2">
                <Label>{t('shortNameFa', { defaultValue: 'Persian Short Name' })}</Label>
                <Input
                  value={formShortNameFa}
                  onChange={(e) => setFormShortNameFa(e.target.value)}
                  maxLength={100}
                  dir="rtl"
                />
              </div>

              {/* English Short Name */}
              <div className="space-y-2">
                <Label>{t('shortNameEn', { defaultValue: 'English Short Name' })}</Label>
                <Input
                  value={formShortNameEn}
                  onChange={(e) => setFormShortNameEn(e.target.value)}
                  maxLength={100}
                  dir="ltr"
                />
              </div>

              {/* IsActive */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="asset-isActive"
                  checked={formIsActive}
                  onCheckedChange={(v) => setFormIsActive(Boolean(v))}
                />
                <Label htmlFor="asset-isActive" className="cursor-pointer">
                  {t('isActive', { defaultValue: 'Active' })}
                </Label>
              </div>

              {/* IsDelisted */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="asset-isDelisted"
                  checked={formIsDelisted}
                  onCheckedChange={(v) => setFormIsDelisted(Boolean(v))}
                />
                <Label htmlFor="asset-isDelisted" className="cursor-pointer">
                  {t('isDelisted', { defaultValue: 'Delisted' })}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {t('common:save', { defaultValue: 'Save' })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
        </div>
      </div>
      <div className="col-span-1">
        <div className="grid gap-5 lg:gap-7.5">
          <MarketSidebar itemCount={assets.length} />
        </div>
      </div>
    </div>
  );
}
