import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

type ConfirmationDialogProps = {
  title: string
  description?: string

  confirmText?: string
  cancelText?: string

  destructive?: boolean

  onConfirm?: () => void

  trigger?: React.ReactNode

  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function ConfirmationDialog({
  title,
  description,

  confirmText = "Confirm",
  cancelText = "Cancel",

  destructive = false,

  onConfirm,

  trigger,

  open,
  onOpenChange,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">
              {cancelText}
            </Button>
          </DialogClose>

          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}