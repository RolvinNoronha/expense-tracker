"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthSelectorProps {
  selectedMonth: string; // "YYYY-MM"
  onMonthChange: (month: string) => void;
}

export const formatMonthLabel = (monthStr: string) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const MonthSelector = ({
  selectedMonth,
  onMonthChange,
}: MonthSelectorProps) => {
  const currentMonth = getCurrentMonthString();
  const isCurrentMonth = selectedMonth === currentMonth;

  // Generate selectable month options
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    // From next 3 months down to past 24 months
    for (let i = -3; i <= 24; i++) {
      const d = new Date(Date.UTC(currentYear, currentMonthNum - i, 1));
      const year = d.getUTCFullYear();
      const monthStr = String(d.getUTCMonth() + 1).padStart(2, "0");
      const val = `${year}-${monthStr}`;
      const label = d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      const isCurr = i === 0;
      options.push({
        value: val,
        label: isCurr ? `${label} (Current)` : label,
      });
    }
    return options;
  }, []);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div>
          <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Viewing Period
          </p>
          <p className="text-sm sm:text-base font-bold text-foreground">
            {formatMonthLabel(selectedMonth)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        {!isCurrentMonth && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(currentMonth)}
            className="text-xs h-8 px-2.5 shrink-0"
          >
            Current Month
          </Button>
        )}

        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-7 w-7 rounded-md shrink-0"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={selectedMonth}
            onValueChange={(val) => {
              if (val) onMonthChange(val);
            }}
          >
            <SelectTrigger className="h-7 border-none bg-transparent shadow-none px-2 text-xs font-semibold focus:ring-0 cursor-pointer min-w-32.5 justify-center">
              <SelectValue>{formatMonthLabel(selectedMonth)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-7 w-7 rounded-md shrink-0"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MonthSelector;
