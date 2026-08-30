import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useAddSubGroup, useUpdateSubGroup } from '../../hooks/useWorkspace';
import { SubGroup } from '../../types';

const subGroupSchema = z.object({
  name: z.string().min(2, 'Sub-group name must be at least 2 characters').max(80),
  description: z.string().max(300).optional(),
});

type SubGroupFormData = z.infer<typeof subGroupSchema>;

interface SubGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  itemId: string;
  itemName: string;
  subGroupToEdit?: SubGroup | null;
}

export function SubGroupFormModal({
  isOpen,
  onClose,
  cardId,
  itemId,
  itemName,
  subGroupToEdit,
}: SubGroupFormModalProps) {
  const isEditing = !!subGroupToEdit;
  const addSubGroupMutation = useAddSubGroup();
  const updateSubGroupMutation = useUpdateSubGroup();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubGroupFormData>({
    resolver: zodResolver(subGroupSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (subGroupToEdit) {
        reset({
          name: subGroupToEdit.name,
          description: subGroupToEdit.description || '',
        });
      } else {
        reset({ name: '', description: '' });
      }
    }
  }, [isOpen, subGroupToEdit, reset]);

  const onSubmit = async (data: SubGroupFormData) => {
    try {
      if (isEditing && subGroupToEdit) {
        await updateSubGroupMutation.mutateAsync({
          cardId,
          itemId,
          subGroupId: subGroupToEdit.id,
          updates: {
            name: data.name,
            description: data.description || '',
          },
        });
      } else {
        await addSubGroupMutation.mutateAsync({
          cardId,
          itemId,
          data: {
            name: data.name,
            description: data.description || '',
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
      title={isEditing ? `Edit Sub-group in "${itemName}"` : `Add Sub-group to "${itemName}"`}
      description="Create a nested sub-group to organize your links into sub-sections."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Sub-group Name <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Batch 1, Practice Question Sets, Lecture Recordings"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Description (Optional)</label>
          <Textarea
            placeholder="Brief note for this sub-group..."
            {...register('description')}
            error={errors.description?.message}
            rows={2}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={addSubGroupMutation.isPending || updateSubGroupMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Add Sub-group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
