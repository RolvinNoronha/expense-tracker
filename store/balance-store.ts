import { create } from "zustand";
import { Balance } from "./interfaces";

export interface BalanceState {
  balance: Balance | null;
  updateBalance: (b: Balance) => void;
}

const useBalanceStore = create<BalanceState>((set) => ({
  balance: null,
  updateBalance: (b: Balance) =>
    set(() => ({
      balance: b,
    })),
}));

export default useBalanceStore;
