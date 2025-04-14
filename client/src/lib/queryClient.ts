import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response before reading to avoid stream already read errors
    const resClone = res.clone();
    
    // Try to parse as JSON first to get structured error details
    let errorText;
    try {
      const errorJson = await resClone.json();
      // If we have a structured error response, format it nicely
      if (errorJson.error || errorJson.message) {
        const errorDetail = errorJson.error || errorJson.message;
        const errorDetails = errorJson.details ? `\n${errorJson.details}` : '';
        errorText = `${errorDetail}${errorDetails}`;
      } else {
        // If it's JSON but not in our expected format
        errorText = JSON.stringify(errorJson);
      }
    } catch (e) {
      // Not JSON, treat as plain text
      try {
        errorText = await res.text() || res.statusText;
      } catch (textError) {
        // If we can't read the text either, fall back to status text
        errorText = res.statusText || 'Unknown error';
      }
    }
    
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  isJson: boolean = true
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {},
    credentials: "include",
  };

  if (isJson && body) {
    options.headers = {
      "Content-Type": "application/json",
    };
    if (method !== "GET") {
      options.body = JSON.stringify(body);
    }
  } else if (body && method !== "GET") {
    // For FormData, don't set Content-Type; browser will set it with boundary
    options.body = body;
  }

  const res = await fetch(url, options);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <TData>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<TData> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as unknown as TData;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
