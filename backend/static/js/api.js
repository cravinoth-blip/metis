export async function request(method, path, body = null) {
  const token = localStorage.getItem('metis_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api' + path, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('metis_token');
    localStorage.removeItem('metis_user');
    location.href = '/login';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }

  return res.json();
}

export const api = {
  get:    path        => request('GET',    path),
  post:   (path, b)  => request('POST',   path, b),
  put:    (path, b)  => request('PUT',    path, b),
  delete: path        => request('DELETE', path),
};
