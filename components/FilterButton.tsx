'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, ChevronDown } from 'lucide-react';

interface FilterButtonProps {
  label: string;
  activeCount: number;
  onClick: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function FilterButton({
  label,
  activeCount,
  onClick,
  isLoading = false,
  icon
}: FilterButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className=" bg-qellow text-qreen-dark hover:bg-qreen-dark hover:text-qellow border-none font-[500] px-4 pl-6 py-2 text-base flex items-center justify-between gap-2 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        {icon || <Filter className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {activeCount > 0 && (
          <Badge variant="secondary" className="bg-qreen text-white text-xs">
            {activeCount}
          </Badge>
        )}
        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
      </div>
    </Button>
  );
}
