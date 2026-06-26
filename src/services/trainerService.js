import apiClient from "./apiClient.js"

export async function getTrainerClassrooms(trainerId) {
  const response = await apiClient.get("/trainer/classrooms", {
    params: { trainerId },
  })
  return response.data
}

export async function getClassroomStudents(trainerId, classroomId, date) {
  const response = await apiClient.get(`/trainer/classrooms/${classroomId}/students`, {
    params: { trainerId, date },
  })
  return response.data
}

export async function saveAttendance(classroomId, data) {
  const response = await apiClient.post(
    `/trainer/classrooms/${classroomId}/attendances`,
    data,
  )
  return response.data
}
