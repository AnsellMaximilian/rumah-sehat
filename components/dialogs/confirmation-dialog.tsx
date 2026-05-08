"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"

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
  pendingText?: string
  cancelText?: string

  destructive?: boolean

  onConfirm?: () => void | boolean | Promise<void | boolean>

  trigger?: React.ReactNode

  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function ConfirmationDialog({
  title,
  description,

  confirmText = "Confirm",
  pendingText = "Confirming...",
  cancelText = "Cancel",

  destructive = false,

  onConfirm,

  trigger,

  open,
  onOpenChange,
}: ConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const isControlled = open !== undefined
  const resolvedOpen = isControlled ? open : internalOpen

  function handleOpenChange(nextOpen: boolean) {
    if (isPending && !nextOpen) {
      return
    }

    if (!isControlled) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  async function handleConfirm() {
    if (isPending) {
      return
    }

    if (!onConfirm) {
      handleOpenChange(false)
      return
    }

    setIsPending(true)

    try {
      const shouldClose = await onConfirm()

      if (shouldClose !== false) {
        handleOpenChange(false)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={!isPending}
        onEscapeKeyDown={(event) => {
          if (isPending) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (isPending) {
            event.preventDefault()
          }
        }}
      >
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
            <Button variant="outline" disabled={isPending}>
              {cancelText}
            </Button>
          </DialogClose>

          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {pendingText}
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
