"use client";

import { useState, useTransition, type FormEvent } from "react";

type BaseState = { error?: string } | undefined;

// Pengganti useActionState untuk form di dalam dialog: alur sukses (mis. menutup
// dialog) dipicu langsung di event handler submit, bukan lewat effect/ref yang
// memantau perubahan `state` — menghindari pola "set state in effect" / "refs
// during render" yang dilarang oleh eslint-plugin-react-hooks versi ini.
export function useServerForm<S extends BaseState>(
  action: (prevState: S, formData: FormData) => Promise<S>,
  onSuccess?: (state: NonNullable<S>) => void,
) {
  const [state, setState] = useState<S>(undefined as S);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(undefined as S, formData);
      setState(result);
      if (result && !result.error) {
        onSuccess?.(result as NonNullable<S>);
      }
    });
  }

  return { state, pending, handleSubmit };
}
