import apiClient from "./apiClient.js"

export async function getPublicTrainers() {
  const response = await apiClient.get("/public/trainers")
  return response.data
}

export async function getPublicClassrooms() {
  const response = await apiClient.get("/public/classrooms")
  return response.data
}
