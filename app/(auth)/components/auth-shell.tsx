import Link from "next/link";
import React from "react";

type AuthShellProps = {
  title: string;
  description: string;
  altActionLabel: string;
  altActionHref: string;
  altActionText: string;
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  description,
  altActionLabel,
  altActionHref,
  altActionText,
  children,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {children}

        <p className="mt-6 text-sm text-muted-foreground">
          {altActionLabel}{" "}
          <Link href={altActionHref} className="font-medium text-foreground">
            {altActionText}
          </Link>
        </p>
      </div>
    </main>
  );
}
