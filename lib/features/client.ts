// A tiny wrapper around fetch(), borrowed from
// https://kentcdodds.com/blog/replace-axios-with-a-simple-custom-fetch-wrapper

// THIS IS A HELPER FUNCTION FOR ASYNC THUNK IN TS

interface ClientResponse<T> {
  status: number;
  data: T;
  headers: Headers;
  url: string;
}

export async function client<T>(
  endpoint: string,
  { body, ...customConfig }: Partial<RequestInit> = {}
): Promise<ClientResponse<T>> {
  const headers =
    body instanceof FormData ? {} : { "Content-Type": "application/json" };

  const config: RequestInit = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body instanceof FormData) {
    config.body = body;
  } else if (body) {
    config.body = JSON.stringify(body);
  }

  let data;
  try {
    const response = await window.fetch(endpoint, config);
    data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        statusText: response.statusText,
        message: data || response.statusText,
      };
    }

    if (response.ok) {
      return {
        status: response.status,
        data,
        headers: response.headers,
        url: response.url,
      };
    }
    throw new Error(response.statusText);
  } catch (err: any) {
    return Promise.reject(err);
  }
}

client.get = function <T>(
  endpoint: string,
  customConfig: Partial<RequestInit> = {}
) {
  return client<T>(endpoint, { ...customConfig, method: "GET" });
};

client.post = function <T>(
  endpoint: string,
  body: any,
  customConfig: Partial<RequestInit> = {}
) {
  return client<T>(endpoint, { ...customConfig, body });
};

client.put = function <T>(
  endpoint: string,
  body: any,
  customConfig: Partial<RequestInit> = {}
) {
  return client<T>(endpoint, { ...customConfig, body, method: "PUT" });
};

client.patch = function <T>(
  endpoint: string,
  body: any,
  customConfig: Partial<RequestInit> = {}
) {
  return client<T>(endpoint, { ...customConfig, body, method: "PATCH" });
};

client.delete = function <T>(
  endpoint: string,
  body: any,
  customConfig: Partial<RequestInit> = {}
) {
  return client<T>(endpoint, { ...customConfig, body, method: "DELETE" });
};
