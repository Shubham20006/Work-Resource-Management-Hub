import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useAddResource, useUpdateResource } from '../../hooks/useWorkspace';
import { Resource } from '../../types';

interface ResourceFormInputs {
  name: string;
  description?: string;
  url: string;
}

const resourceSchema = z.object({
  name: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(300).optional(),
  url: z.string().url('Please enter a valid URL (including https:// or http://)'),
});

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  itemId: string;
  itemName: string;
  subGroupId?: string;
  resourceToEdit?: Resource | null;
}

export function ResourceFormModal({
  isOpen,
  onClose,
  cardId,
  itemId,
  itemName,
  subGroupId,
  resourceToEdit,
}: ResourceFormModalProps) {
  const isEditing = !!resourceToEdit;
  const addResourceMutation = useAddResource();
  const updateResourceMutation = useUpdateResource();

  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResourceFormInputs>({
    resolver: zodResolver(resourceSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      url: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (resourceToEdit) {
        reset({
          name: resourceToEdit.name,
          description: resourceToEdit.description || '',
          url: resourceToEdit.url,
        });
        setEmails(resourceToEdit.emailsUsed || []);
      } else {
        reset({
          name: '',
          description: '',
          url: '',
        });
        setEmails([]);
      }
      setEmailInput('');
    }
  }, [isOpen, resourceToEdit, reset]);

  const handleAddEmail = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const email = emailInput.trim();
    if (email && !emails.includes(email)) {
      setEmails([...emails, email]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const onSubmit = async (data: ResourceFormInputs) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || '',
        url: data.url,
        emailsUsed: emails,
        subGroupId: subGroupId || undefined,
      };

      if (isEditing && resourceToEdit) {
        await updateResourceMutation.mutateAsync({
          cardId,
          itemId,
          resourceId: resourceToEdit.id,
          updates: payload,
        });
      } else {
        await addResourceMutation.mutateAsync({
          cardId,
          itemId,
          resource: payload,
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
      title={isEditing ? `Edit Link in "${itemName}"` : `Add Link to "${itemName}"`}
      description="Add a destination URL and optional email accounts associated with this link."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Staging, Production, Documentation"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Description (Optional)</label>
          <Textarea
            placeholder="Brief overview or note for this link..."
            {...register('description')}
            error={errors.description?.message}
            rows={2}
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            URL <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="https://example.com"
            {...register('url')}
            error={errors.url?.message}
          />
        </div>

        {/* Emails Used (Optional) */}
        <div className="space-y-2 p-3 rounded-xl border border-border bg-muted/20">
          <label className="block text-xs font-semibold text-foreground">Emails Used (Optional)</label>
          <div className="flex gap-2">
            <Input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleAddEmail}
              leftIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
              placeholder="e.g. admin@example.com"
              className="text-xs h-9"
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddEmail} className="shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Email
            </Button>
          </div>

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-card text-foreground border border-border shadow-2xs"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={addResourceMutation.isPending || updateResourceMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Add Link'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
