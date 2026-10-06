import apiClient from "./apiClient"

export async function loginUser(credentials) {
    const response = await apiClient.post("/auth/login", credentials)
    return response.data
}

export async function registerUser(userData) {
    const response = await apiClient.post("/auth/register", userData)
    return response.data
}

export async function getProfile() {
    const response = await apiClient.get("/account/profile")
    return response.data
}

export async function updateProfile(profile) {
    const response = await apiClient.put("/account/profile", profile)
    return response.data
}
