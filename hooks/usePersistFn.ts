import * as React from "react";

type noop = (...args: unknown[]) => unknown;

/**
 * usePersistFn 可以替代 useCallback 以降低心智负担
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = React.useRef<T>(fn);
  // keep current function in ref for latest call
  React.useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const persistFn = React.useMemo(() => {
    const wrapper = ((...args: unknown[]) => {
      return (fnRef.current as unknown as T)(...args as Parameters<T>);
    }) as unknown as T;

    return wrapper;
  }, []);

  return persistFn;
}
