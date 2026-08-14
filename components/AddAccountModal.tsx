"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, LoaderCircleIcon, Wallet } from "lucide-react";
import AppService from "@/services/AppService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
}

const AddAccountModal = ({ open, onClose }: AddAccountModalProps) => {
  const [accountName, setAccountName] = useState("");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setError("Please enter an account name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsedBalance = balance ? parseFloat(balance) : 0;
      if (isNaN(parsedBalance) || parsedBalance < 0) {
        setError("Please enter a valid starting balance (positive number).");
        setLoading(false);
        return;
      }

      const result = await AppService.addAccount({
        accountName: accountName.trim(),
        balance: parsedBalance,
      });

      if (result.success) {
        toast.success("Account created successfully!");
        await queryClient.invalidateQueries({ queryKey: ["accounts"] });
        setAccountName("");
        setBalance("");
        onClose();
      } else {
        setError(result.message || "Failed to create account.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create account.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a bank account, credit card, or wallet (Max 5 accounts)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Account Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. HDFC Bank, Cash Wallet, Salary Account"
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                setError("");
              }}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Initial Balance (₹)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={balance}
              onChange={(e) => {
                setBalance(e.target.value);
                setError("");
              }}
              step="0.01"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Set the current balance in this account
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <LoaderCircleIcon className="animate-spin mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountModal;
