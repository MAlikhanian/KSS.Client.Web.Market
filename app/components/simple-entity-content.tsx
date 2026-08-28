'use client';

/**
 * Generic CRUD UI for "simple" reference entities that consist of:
 *   - A parent row with int Id, Code, IsActive
 *   - One translation row per language (fa + en) with Name
 *
 * Used for MarketType / AssetType / Sector. Each translation key in i18n
 * follows the same shape: pageTitle, addDialog, editDialog, code, nameFa,
 * nameEn, isActive, noItems, added, updated, deleted, confirmDelete,
 * loadFailed, saveFailed.
 */

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
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';
import { localizeDigits } from '@/app/components/person/format-utils';

interface SimpleEntityContentProps {
  /** i18n namespace (e.g. 'market-type', 'market-asset-type', 'market-sector') */
  namespace: string;
  /** Next.js API route for the parent entity (e.g. '/api/market/market-type') */
  listEndpoint: string;
  /** Next.js API route for the translation entity (e.g. '/api/market/market-type/translation') */
  translationEndpoint: string;
  /** Foreign-key field used by translations (e.g. 'marketTypeId') */
  fkField: string;
  /** Tailwind color name for the colored badge (e.g. 'blue', 'purple', 'indigo') */
  badgeColor: string;
}

interface EntityRow {
  id: number;
  code: string;
  isActive: boolean;
}

interface TranslationRow {
  languageId: number;
  name: string;
  [key: string]: unknown;
}

const FA_LANG = 12;
const EN_LANG = 10;

// Static color map so Tailwind's JIT can detect the class names at build time
const BADGE_COLOR_CLASS: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  violet: 'bg-violet-500',
};

export function SimpleEntityContent({
  namespace,
  listEndpoint,
  translationEndpoint,
  fkField,
  badgeColor,
}: SimpleEntityContentProps) {
  const { t, i18n } = useTranslation(namespace);
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US';

  const [rows, setRows] = useState<EntityRow[]>([]);
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formNameFa, setFormNameFa] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [saving, setSaving] = useState(false);

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
      const [listRes, trRes] = await Promise.all([
        fetch(listEndpoint, { cache: 'no-store' }),
        fetch(translationEndpoint, { cache: 'no-store' }),
      ]);
      if (!listRes.ok) throw new Error('list');
      if (!trRes.ok) throw new Error('translations');
      const listData = await listRes.json();
      const trData = await trRes.json();
      setRows(Array.isArray(listData) ? listData : []);
      setTranslations(Array.isArray(trData) ? trData : []);
    } catch {
      showToast(t('loadFailed', { defaultValue: 'Failed to load data' }), 'error');
    } finally {
      setLoading(false);
    }
  }, [listEndpoint, translationEndpoint, showToast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getName = useCallback(
    (id: number, langId: number) => {
      const tr = translations.find(
        (x) => (x[fkField] as number) === id && x.languageId === langId,
      );
      return tr?.name || '';
    },
    [translations, fkField],
  );

  const resetForm = () => {
    setEditingId(null);
    setFormCode('');
    setFormIsActive(true);
    setFormNameFa('');
    setFormNameEn('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: EntityRow) => {
    setEditingId(row.id);
    setFormCode(row.code);
    setFormIsActive(row.isActive);
    setFormNameFa(getName(row.id, FA_LANG));
    setFormNameEn(getName(row.id, EN_LANG));
    setDialogOpen(true);
  };

  const upsertTranslation = async (entityId: number, languageId: number, name: string) => {
    const existing = translations.find(
      (x) => (x[fkField] as number) === entityId && x.languageId === languageId,
    );
    const body: Record<string, unknown> = { [fkField]: entityId, languageId, name };
    const method = existing ? 'PUT' : 'POST';
    const res = await fetch(translationEndpoint, {
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
    if (!formCode.trim()) {
      showToast(t('saveFailed', { defaultValue: 'Save failed' }), 'error');
      return;
    }
    setSaving(true);
    try {
      let entityId: number;
      if (editingId !== null) {
        const res = await fetch(listEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, code: formCode, isActive: formIsActive }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'update');
        }
        entityId = editingId;
      } else {
        const res = await fetch(listEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: formCode, isActive: formIsActive }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'add');
        }
        const created = await res.json();
        entityId = created.id;
      }

      // Upsert fa + en translations (skip empty)
      if (formNameFa.trim()) {
        await upsertTranslation(entityId, FA_LANG, formNameFa.trim());
      }
      if (formNameEn.trim()) {
        await upsertTranslation(entityId, EN_LANG, formNameEn.trim());
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

  const handleDelete = async (row: EntityRow) => {
    try {
      const res = await fetch(listEndpoint, {
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

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.id - b.id),
    [rows],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`w-8 h-8 ${BADGE_COLOR_CLASS[badgeColor] ?? 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-sm font-bold`}></span>
          {t('pageTitle', { defaultValue: namespace })}
          <Badge variant="outline">{rows.length.toLocaleString(locale)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 ml-1" />
              {t('common:add', { defaultValue: 'Add' })}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('common:loading', { defaultValue: 'Loading...' })}
            </p>
          ) : sortedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noItems', { defaultValue: 'No items' })}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t('code', { defaultValue: 'Code' })}</TableHead>
                  <TableHead>{t('nameFa', { defaultValue: 'Persian Name' })}</TableHead>
                  <TableHead>{t('nameEn', { defaultValue: 'English Name' })}</TableHead>
                  <TableHead>{t('isActive', { defaultValue: 'Active' })}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{localizeDigits(`${index + 1}`, locale)}</TableCell>
                    <TableCell className="font-mono">{row.code}</TableCell>
                    <TableCell>{getName(row.id, FA_LANG) || '—'}</TableCell>
                    <TableCell>{getName(row.id, EN_LANG) || '—'}</TableCell>
                    <TableCell>
                      {row.isActive ? (
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId !== null
                  ? t('editDialog', { defaultValue: 'Edit' })
                  : t('addDialog', { defaultValue: 'Add' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {t('code', { defaultValue: 'Code' })}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('nameFa', { defaultValue: 'Persian Name' })}</Label>
                <Input
                  value={formNameFa}
                  onChange={(e) => setFormNameFa(e.target.value)}
                  maxLength={100}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('nameEn', { defaultValue: 'English Name' })}</Label>
                <Input
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  maxLength={100}
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${namespace}-isActive`}
                  checked={formIsActive}
                  onCheckedChange={(v) => setFormIsActive(Boolean(v))}
                />
                <Label htmlFor={`${namespace}-isActive`} className="cursor-pointer">
                  {t('isActive', { defaultValue: 'Active' })}
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
  );
}
