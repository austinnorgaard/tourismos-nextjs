"use client";

import { useRouter } from "next/navigation";

/**
 * Returns a navigate function compatible with `useAuth`'s optional `navigate`
 * parameter. This hook must be used from client components only.
 */
export function useAuthNavigate() {
  const router = useRouter();

  const navigate = (path: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };

  return navigate;
}
