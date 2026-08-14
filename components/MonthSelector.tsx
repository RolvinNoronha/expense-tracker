"use client";

import { Button } from "@/components/ui/button";
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
            className="h-7 w-7 rounded-md"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              if (e.target.value) {
                onMonthChange(e.target.value);
              }
            }}
            className="text-xs font-semibold bg-transparent px-1.5 py-0.5 cursor-pointer focus:outline-hidden text-center max-w-32.5"
            title="Select specific month"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-7 w-7 rounded-md"
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
