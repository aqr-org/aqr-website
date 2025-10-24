'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterModalProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function FilterModal({
  title,
  options,
  selectedValues,
  onSelectionChange,
  isLoading = false,
  children
}: FilterModalProps) {
  const [open, setOpen] = useState(false);

  const handleOptionToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const selectAll = () => {
    onSelectionChange(options.map(option => option.value));
  };

  const hasSelection = selectedValues.length > 0;
  const allSelected = selectedValues.length === options.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-qreen-dark">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 flex flex-col h-[calc(90vh-10rem)]">
          {/* Selection Summary */}
          {hasSelection && (
            <div className="bg-qaupe p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">
                  {selectedValues.length} of {options.length} selected
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1 cursor-pointer" />
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedValues.map(value => {
                  const option = options.find(opt => opt.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="bg-qreen/20 text-qreen-dark"
                    >
                      {option?.label}
                      <button
                        onClick={() => handleOptionToggle(value)}
                        className="ml-2 hover:text-red-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Select All / Clear All Actions */}
          <div className="flex justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={allSelected ? clearAll : selectAll}
              className="text-sm bg-qreen-dark border-none text-qellow"
            >
              {allSelected ? 'Clear All' : 'Select All'}
            </Button>
            <span className="text-sm text-gray-500 self-center">
              {options.length} options available
            </span>
          </div>

          {/* Options List */}
          <div className="rounded-lg bg-qreen/10 force-scrollbar overflow-y-auto gap-0">
            {options.map(option => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-qreen/10 border border-qreen/20' 
                      : 'hover:bg-qreen/20'
                  }`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleOptionToggle(option.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-qreen border-qreen' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-qreen-dark">{option.label}</span>
                  </div>
                  <span className="text-sm text-qreen-dark">({option.count})</span>
                </label>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {/* <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button> */}
            <Button
              onClick={() => {
                setOpen(false);
              }}
              disabled={isLoading}
              className="bg-qreen border-none text-white hover:bg-qreen/90"
            >
              {isLoading ? 'Applying Filters...' : 'Apply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
