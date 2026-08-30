import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export const THEME_COLORS = [
  { id: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-500', textClass: 'text-indigo-500', borderClass: 'border-indigo-500', badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  { id: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-500', textClass: 'text-emerald-500', borderClass: 'border-emerald-500', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { id: 'amber', label: 'Amber', bgClass: 'bg-amber-500', textClass: 'text-amber-500', borderClass: 'border-amber-500', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'rose', label: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-rose-500', borderClass: 'border-rose-500', badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { id: 'cyan', label: 'Cyan', bgClass: 'bg-cyan-500', textClass: 'text-cyan-500', borderClass: 'border-cyan-500', badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { id: 'purple', label: 'Purple', bgClass: 'bg-purple-500', textClass: 'text-purple-500', borderClass: 'border-purple-500', badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { id: 'blue', label: 'Blue', bgClass: 'bg-blue-500', textClass: 'text-blue-500', borderClass: 'border-blue-500', badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { id: 'teal', label: 'Teal', bgClass: 'bg-teal-500', textClass: 'text-teal-500', borderClass: 'border-teal-500', badgeClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  { id: 'orange', label: 'Orange', bgClass: 'bg-orange-500', textClass: 'text-orange-500', borderClass: 'border-orange-500', badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  { id: 'pink', label: 'Pink', bgClass: 'bg-pink-500', textClass: 'text-pink-500', borderClass: 'border-pink-500', badgeClass: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
];

export function getColorClasses(colorId: string) {
  const match = THEME_COLORS.find((c) => c.id === colorId);
  return match || THEME_COLORS[0];
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {THEME_COLORS.map((c) => {
        const isSelected = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-background',
              c.bgClass,
              isSelected ? 'ring-primary scale-110 shadow-md' : 'ring-transparent'
            )}
            title={c.label}
          >
            {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
          </button>
        );
      })}
    </div>
  );
}
