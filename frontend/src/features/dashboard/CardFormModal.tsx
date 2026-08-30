import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { AVAILABLE_ICONS } from '../../components/ui/IconRenderer';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useCreateCard, useUpdateCard } from '../../hooks/useCards';
import { Card } from '../../types';

interface CardFormInputs {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

const cardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name must be under 60 characters'),
  description: z.string().optional(),
  icon: z.string().min(1, 'Please select an icon'),
  color: z.string().min(1, 'Please select a color'),
  category: z.string().min(1, 'Please select a category'),
});

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: Card | null;
}

const CATEGORY_PRESETS = ['Projects', 'Academic', 'Sheets', 'CFP', 'Other'];

export function CardFormModal({ isOpen, onClose, cardToEdit }: CardFormModalProps) {
  const isEditing = !!cardToEdit;
  const createMutation = useCreateCard();
  const updateMutation = useUpdateCard();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CardFormInputs>({
    resolver: zodResolver(cardSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      icon: 'FolderKanban',
      color: 'indigo',
      category: 'Projects',
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');
  const selectedCategory = watch('category');

  useEffect(() => {
    if (cardToEdit) {
      reset({
        name: cardToEdit.name,
        description: cardToEdit.description || '',
        icon: cardToEdit.icon || 'FolderKanban',
        color: cardToEdit.color || 'indigo',
        category: cardToEdit.category || 'Projects',
      });
    } else {
      reset({
        name: '',
        description: '',
        icon: 'FolderKanban',
        color: 'indigo',
        category: 'Projects',
      });
    }
  }, [cardToEdit, isOpen, reset]);

  const onSubmit = async (data: CardFormInputs) => {
    try {
      if (isEditing && cardToEdit) {
        await updateMutation.mutateAsync({
          id: cardToEdit.id,
          updates: {
            name: data.name,
            description: data.description,
            icon: data.icon,
            color: data.color,
            category: data.category,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          category: data.category || 'Other',
        });
      }
      onClose();
    } catch (err) {
      // Handled by mutation toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Workspace' : 'Create New Workspace'}
      description={
        isEditing
          ? 'Update the workspace details, category, or color theme.'
          : 'Create a top-level workspace to organize your subprojects, sheets, and links.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Workspace Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Workspace Name <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. BL Projects, 3rd Year 2026, CFP"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Description (Optional)</label>
          <Textarea
            placeholder="Brief overview of what this workspace contains..."
            {...register('description')}
            error={errors.description?.message}
            rows={2}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Category *</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_PRESETS.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setValue('category', cat)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                  selectedCategory === cat
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Color Accent */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Color Accent</label>
          <ColorPicker value={selectedColor} onChange={(c) => setValue('color', c)} />
        </div>

        {/* Workspace Icon */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Workspace Icon</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 rounded-xl border border-border/80 bg-muted/20 max-h-32 overflow-y-auto custom-scrollbar">
            {AVAILABLE_ICONS.map((item) => {
              const isSelected = selectedIcon === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setValue('icon', item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs scale-105'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent'
                  }`}
                  title={item.label}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
