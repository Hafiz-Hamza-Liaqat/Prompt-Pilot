'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { signOutAction } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';

type AccountMenuProps = {
  isAuthenticated: boolean;
  displayName?: string | null;
};

export function AccountMenu({ isAuthenticated, displayName }: AccountMenuProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const triggerLabel = isAuthenticated
    ? displayName?.trim() || 'Account menu'
    : 'Account menu';

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        {triggerLabel}
      </Button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 min-w-44 rounded-md border border-border bg-background p-2 shadow-sm"
        >
          <ul className="space-y-1">
            {isAuthenticated ? (
              <>
                <li role="none">
                  <Link
                    role="menuitem"
                    href="/projects"
                    className="block rounded-sm px-3 py-2 text-sm text-foreground no-underline hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpen(false)}
                  >
                    Projects
                  </Link>
                </li>
                <li role="none">
                  <Link
                    role="menuitem"
                    href="/account"
                    className="block rounded-sm px-3 py-2 text-sm text-foreground no-underline hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpen(false)}
                  >
                    Account
                  </Link>
                </li>
                <li role="none">
                  <Link
                    role="menuitem"
                    href="/"
                    className="block rounded-sm px-3 py-2 text-sm text-foreground no-underline hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpen(false)}
                  >
                    Public home
                  </Link>
                </li>
                <li role="none">
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="w-full rounded-sm px-3 py-2 text-left text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Sign out
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li role="none">
                  <Link
                    role="menuitem"
                    href="/auth/sign-in"
                    className="block rounded-sm px-3 py-2 text-sm text-foreground no-underline hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                </li>
                <li role="none">
                  <Link
                    role="menuitem"
                    href="/auth/sign-up"
                    className="block rounded-sm px-3 py-2 text-sm text-foreground no-underline hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpen(false)}
                  >
                    Create account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
