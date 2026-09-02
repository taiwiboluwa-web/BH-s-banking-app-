async function request(path, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed with status code ${response.status}`);
  }

  return { data };
}

export function createApi(fetchImpl = fetch) {
  return {
    get: (path) => request(path, { method: 'GET' }, fetchImpl),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }, fetchImpl),
  };
}

export const api = createApi();
