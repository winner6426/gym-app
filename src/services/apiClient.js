import axios from "axios"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("gym-token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Lỗi kết nối mạng. Vui lòng kiểm tra lại internet."))
    }

    if (error.response.status === 401) {
      sessionStorage.removeItem("gym-token")
      sessionStorage.removeItem("gym-user")
      window.location.href = "/login"
    }

    return Promise.reject(error)
  },
)

export default apiClient
