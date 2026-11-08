import { useEffect, useState } from 'react';

type ApiDataState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

type JsonLoader<T> = (path: string) => Promise<T>;

export function useApiData<T>(path: string, load: JsonLoader<T>): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ data: null, error: null, loading: true });

  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });
    load(path).then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (active) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : 'Unable to load data',
            loading: false,
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [path, load]);

  return state;
}
