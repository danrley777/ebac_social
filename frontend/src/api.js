const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('ebac_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Token ${token}`} : {}), ...options.headers},
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail || data.non_field_errors?.[0] || Object.values(data).flat()[0] || 'Algo deu errado.'
    throw new Error(detail)
  }
  return data
}
