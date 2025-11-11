import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchWithFilterProps {
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; checked?: boolean }>;
  onSelectionChange: (selectedValues: string[]) => void;
  selectedValues: string[];
  className?: string;
  maxHeight?: string;
}

export function SearchWithFilter({
  label,
  placeholder = "Search...",
  options,
  onSelectionChange,
  selectedValues,
  className,
  maxHeight = "240px"
}: SearchWithFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckChange = (value: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, value]);
    } else {
      onSelectionChange(selectedValues.filter(v => v !== value));
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <div className="border rounded-lg overflow-hidden bg-background">
        <div className="relative border-b">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 border-0 focus-visible:border-0"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <ScrollArea style={{ maxHeight }}>
          <div className="p-2 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleCheckChange(option.value, !selectedValues.includes(option.value))}
                >
                  <Checkbox
                    id={option.value}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => handleCheckChange(option.value, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label
                    htmlFor={option.value}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {option.label}
                  </label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
