import { zodResolver } from '@hookform/resolvers/zod';
import { FileSpreadsheet, FolderGit2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useAddItem, useUpdateItem } from '../../hooks/useWorkspace';
import { Item } from '../../types';

const itemSchema = z.object({
  name: z.string().min(2, 'Name / Title must be at least 2 characters').max(80),
  description: z.string().max(300).optional(),
  githubUrl: z.string().optional(),
  resourceUrl: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardCategory?: string;
  itemToEdit?: Item | null;
}

export function ItemFormModal({ isOpen, onClose, cardId, cardCategory, itemToEdit }: ItemFormModalProps) {
  const isEditing = !!itemToEdit;
  const addItemMutation = useAddItem();
  const updateItemMutation = useUpdateItem();

  const isProject = cardCategory === 'Projects';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      githubUrl: '',
      resourceUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        reset({
          name: itemToEdit.name,
          description: itemToEdit.description || '',
          githubUrl: itemToEdit.githubUrl || '',
          resourceUrl: itemToEdit.resourceUrl || '',
        });
      } else {
        reset({ name: '', description: '', githubUrl: '', resourceUrl: '' });
      }
    }
  }, [isOpen, itemToEdit, reset]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      if (isEditing && itemToEdit) {
        await updateItemMutation.mutateAsync({
          cardId,
          itemId: itemToEdit.id,
          updates: {
            name: data.name,
            description: data.description || '',
            githubUrl: isProject ? data.githubUrl?.trim() || '' : '',
            resourceUrl: !isProject ? data.resourceUrl?.trim() || '' : '',
          },
        });
      } else {
        await addItemMutation.mutateAsync({
          cardId,
          data: {
            name: data.name,
            description: data.description || '',
            githubUrl: isProject ? data.githubUrl?.trim() || undefined : undefined,
            resourceUrl: !isProject ? data.resourceUrl?.trim() || undefined : undefined,
          },
        });
      }
      onClose();
    } catch (e) {
      // Handled by toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? isProject
            ? 'Edit Subproject'
            : 'Edit Group'
          : isProject
          ? 'Add Subproject'
          : 'Add Group'
      }
      description={
        isProject
          ? 'Add a subproject to group your project URLs and repositories.'
          : 'Add a section or group to organize your sheets and resources.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Name / Title */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            {isProject ? 'App / Project Name *' : 'Title *'}
          </label>
          <Input
            placeholder={isProject ? 'e.g. Review AI' : 'e.g. Student Details'}
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Description (Optional)</label>
          <Textarea
            placeholder={isProject ? 'e.g. AI-based review application' : 'e.g. Master student information sheet'}
            {...register('description')}
            error={errors.description?.message}
            rows={2}
          />
        </div>

        {/* Project GitHub URL (If Category is Projects) */}
        {isProject && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">GitHub Repository URL (Optional)</label>
            <Input
              leftIcon={<FolderGit2 className="h-4 w-4 text-muted-foreground" />}
              placeholder="https://github.com/..."
              {...register('githubUrl')}
            />
          </div>
        )}

        {/* Sheet / Resource URL (If Category is NOT Projects) */}
        {!isProject && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Sheet / Resource URL (Optional)</label>
            <Input
              leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-500" />}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              {...register('resourceUrl')}
            />
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={addItemMutation.isPending || updateItemMutation.isPending}>
            {isEditing ? 'Save Changes' : isProject ? 'Add Subproject' : 'Add Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
