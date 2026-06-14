"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  Check,
  HandCoins,
  LoaderCircleIcon,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import AppService from "@/services/AppService";
import { useFetchOwedEntries } from "@/hooks/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { OwedEntry } from "@/store/interfaces";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (timestamp: { _seconds: number; _nanoseconds: number }) => {
  return new Date(timestamp._seconds * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const OwedEntryCard = ({ entry }: { entry: OwedEntry }) => {
  const queryClient = useQueryClient();
  const [marking, setMarking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleMarkPaid = async () => {
    setMarking(true);
    try {
      const result = await AppService.markOwedEntryPaid(entry.owedId);
      if (result.success) {
        toast.success(`Marked ${entry.personName}'s entry as paid`);
        await queryClient.invalidateQueries({ queryKey: ["owed-entries"] });
      }
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await AppService.deleteOwedEntry(entry.owedId);
      if (result.success) {
        toast.success("Entry deleted");
        await queryClient.invalidateQueries({ queryKey: ["owed-entries"] });
      }
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  };

  const isPaid = entry.status === "paid";

  return (
    <Card
      className={`transition-all ${
        isPaid ? "opacity-60 border-green-500/30" : ""
      }`}
    >
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`font-semibold truncate ${
                  isPaid ? "line-through text-muted-foreground" : ""
                }`}
              >
                {entry.personName}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  isPaid
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {isPaid ? "Paid" : "Pending"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span>{formatDate(entry.createdAt)}</span>
              {entry.description && (
                <>
                  <span>·</span>
                  <span className="truncate">{entry.description}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-sm font-bold text-primary whitespace-nowrap">
              {formatCurrency(entry.amount)}
            </p>
            {!isPaid && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                onClick={handleMarkPaid}
                disabled={marking}
                title="Mark as paid"
              >
                {marking ? (
                  <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete entry"
            >
              {deleting ? (
                <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OwedToMeSection = () => {
  const { data, isPending } = useFetchOwedEntries();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const entries = data?.data.entries ?? [];
  const pendingEntries = entries.filter((e) => e.status === "pending");
  const paidEntries = entries.filter((e) => e.status === "paid");

  const totalPending = pendingEntries.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount) {
      setError("Please fill in name and amount.");
      return;
    }

    setAdding(true);
    try {
      const result = await AppService.addOwedEntry({
        personName,
        amount: Number(amount),
        description: description || "",
      });
      if (result.success) {
        setPersonName("");
        setAmount("");
        setDescription("");
        setError("");
        toast.success("Entry added");
        await queryClient.invalidateQueries({ queryKey: ["owed-entries"] });
        setOpen(false);
      }
    } catch {
      toast.error("Failed to add entry");
    } finally {
      setAdding(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Loading entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-linear-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Total Owed to You
                </p>
                <p className="text-4xl font-bold mt-2 text-primary">
                  {formatCurrency(totalPending)}
                </p>
              </div>
              <HandCoins className="h-12 w-12 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  People
                </p>
                <p className="text-4xl font-bold mt-2">
                  {pendingEntries.length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  pending · {paidEntries.length} paid
                </p>
              </div>
              <Users className="h-12 w-12 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Entries */}
      {pendingEntries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Pending</h2>
          {pendingEntries.map((entry) => (
            <OwedEntryCard key={entry.owedId} entry={entry} />
          ))}
        </div>
      )}

      {/* Paid Entries */}
      {paidEntries.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-muted-foreground">Paid</h2>
          {paidEntries.map((entry) => (
            <OwedEntryCard key={entry.owedId} entry={entry} />
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No entries yet</p>
          <p className="text-sm mt-1">
            Add someone who owes you money to get started.
          </p>
        </div>
      )}

      {/* Floating Add Button with Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-112.5"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add Owed Entry</DialogTitle>
            <DialogDescription>
              Record money that someone owes you
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Person Name</label>
              <Input
                placeholder="Who owes you?"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input
                placeholder="What is it for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                disabled={adding}
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                disabled={adding}
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {adding ? <LoaderCircleIcon className="animate-spin" /> : null}
                {adding ? "Adding..." : "Add Entry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwedToMeSection;
