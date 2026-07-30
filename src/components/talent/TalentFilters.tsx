import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { TalentFilterState } from "@/hooks/useTalentCandidates";

interface FilterOptions {
  techStack: string[];
  gradYears: string[];
  universities: string[];
  availability: { value: string; label: string }[];
}

interface TalentFiltersProps {
  filters: TalentFilterState;
  options: FilterOptions;
  onChange: (filters: TalentFilterState) => void;
  onClear: () => void;
}

const stopSpace = (e: React.KeyboardEvent) => {
  if (e.key === " ") e.stopPropagation();
};

const CheckboxList = ({
  items,
  selected,
  onToggle,
  searchable,
  emptyLabel,
}: {
  items: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  searchable?: boolean;
  emptyLabel: string;
}) => {
  const [query, setQuery] = useState("");
  const visible = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {searchable && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDownCapture={stopSpace}
          placeholder="Search..."
          className="h-8 text-sm"
        />
      )}
      <ScrollArea className={items.length > 8 ? "h-44 pr-3" : "pr-3"}>
        <div className="space-y-2">
          {visible.map((item) => (
            <label
              key={item.value}
              className="flex items-start gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(item.value)}
                onCheckedChange={() => onToggle(item.value)}
                className="mt-0.5"
              />
              <span className="leading-snug break-words">{item.label}</span>
            </label>
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">No matches</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const TalentFilters = ({ filters, options, onChange, onClear }: TalentFiltersProps) => {
  const toggle = (key: keyof Omit<TalentFilterState, "search">, value: string) => {
    const current = filters[key];
    onChange({
      ...filters,
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const activeCount =
    filters.techStack.length +
    filters.gradYears.length +
    filters.universities.length +
    filters.availability.length +
    (filters.verifiedAchievementsOnly ? 1 : 0) +
    (filters.search.trim() ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Filters</h2>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onClear}>
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Search candidates</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            onKeyDownCapture={stopSpace}
            placeholder="Name, school, skill..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="verified-achievements" className="text-sm">
            Verified NextGen Achievement Holders
          </Label>
          <p className="text-xs text-muted-foreground">
            Only students with an official endorsement badge
          </p>
        </div>
        <Switch
          id="verified-achievements"
          checked={filters.verifiedAchievementsOnly}
          onCheckedChange={(checked) =>
            onChange({ ...filters, verifiedAchievementsOnly: checked })
          }
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Tech stack</Label>
        <CheckboxList
          items={options.techStack.map((t) => ({ value: t, label: t }))}
          selected={filters.techStack}
          onToggle={(v) => toggle("techStack", v)}
          searchable
          emptyLabel="No skills published yet"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Graduation year</Label>
        <CheckboxList
          items={options.gradYears.map((y) => ({ value: y, label: y }))}
          selected={filters.gradYears}
          onToggle={(v) => toggle("gradYears", v)}
          emptyLabel="No graduation years listed"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">University</Label>
        <CheckboxList
          items={options.universities.map((u) => ({ value: u, label: u }))}
          selected={filters.universities}
          onToggle={(v) => toggle("universities", v)}
          searchable
          emptyLabel="No universities listed"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Work availability</Label>
        <CheckboxList
          items={options.availability}
          selected={filters.availability}
          onToggle={(v) => toggle("availability", v)}
          emptyLabel="No availability set yet"
        />
      </div>
    </div>
  );
};
