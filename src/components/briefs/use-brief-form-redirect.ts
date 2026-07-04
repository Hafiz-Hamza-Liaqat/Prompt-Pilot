'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { BriefFormState } from '@/app/projects/[projectId]/brief/actions';

export function useBriefFormRedirect(state: BriefFormState) {
  const router = useRouter();

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state.redirectTo, router]);
}
