"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AppService from "@/services/AppService";
import { toast } from "sonner";
import { LoaderCircleIcon } from "lucide-react";

interface DeleteConfirmationModalProps {
  onClose: () => void;
  txnId: string;
}

const DeleteConfirmationModal = ({
  onClose,
  txnId,
}: DeleteConfirmationModalProps) => {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleDeleteTransaction = async () => {
    setDeleting(true);
    try {
      const result = await AppService.deleteTransaction(txnId);

      if (result.success) {
        toast.success("Successfully deleted transaction");
        queryClient.invalidateQueries({
          queryKey: [
            "balance",
            "transactions",
            "ten-transactions",
            "transaction-days",
          ],
        });
      }
    } catch (error) {
      toast.error("Failed to delete transaction");
      console.error("Failed to delete transaction: ", error);
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end pt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDeleteTransaction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
              {deleting ? <LoaderCircleIcon className="animate-spin" /> : null}
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationModal;
