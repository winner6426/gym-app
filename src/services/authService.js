import apiClient from "./apiClient"

export async function loginUser(credentials) {
    const response = await apiClient.post("/auth/login", credentials)
    return response.data
}

export async function registerUser(userData) {
    const response = await apiClient.post("/auth/register", userData)
    return response.data
}