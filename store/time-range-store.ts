import { create } from "zustand";

export interface TimeRangeState {
  range: number;
  updatedRange: (r: number) => void;
}

const useTimeRangeStore = create<TimeRangeState>((set) => ({
  range: 30,
  updatedRange: (r: number) =>
    set(() => ({
      range: r,
    })),
}));

export default useTimeRangeStore;
