import apiClient from "./apiClient.js"


// Center api //
export async function getCenters() {
  const response = await apiClient.get("/admin/centers")
  return response.data
}

export async function createCenter(center) {
  const response = await apiClient.post("/admin/centers", center)
  return response.data
}

export async function updateCenter(id, center) {
  const response = await apiClient.put(`/admin/centers/${id}`, center)
  return response.data
}

export async function deleteCenter(id) {
  await apiClient.delete(`/admin/centers/${id}`)
}


// Course api //
export async function getCourses(active) {
  const response = await apiClient.get("/admin/courses", {
    params: active === undefined ? {} : { active },
  })
  return response.data
}

export async function createCourse(course) {
  const response = await apiClient.post("/admin/courses", course)
  return response.data
}

export async function updateCourse(id, course) {
  const response = await apiClient.put(`/admin/courses/${id}`, course)
  return response.data
}

export async function setCourseActive(id, active) {
  const response = await apiClient.patch(
    `/admin/courses/${id}/active`,
    null,
    { params: { active } },
  )
  return response.data
}


// Classroom api //
export async function getClassrooms(params = {}) {
  const response = await apiClient.get("/admin/classrooms", { params })
  return response.data
}

export async function getTrainers() {
  const response = await apiClient.get("/admin/classrooms/trainers")
  return response.data
}

export async function createClassroom(classroom) {
  const response = await apiClient.post("/admin/classrooms", classroom)
  return response.data
}

export async function updateClassroom(id, classroom) {
  const response = await apiClient.put(`/admin/classrooms/${id}`, classroom)
  return response.data
}

export async function setClassroomStatus(id, status) {
  const response = await apiClient.patch(
    `/admin/classrooms/${id}/status`,
    null,
    { params: { status } },
  )
  return response.data
}


// User api //
export async function getUsers(params = {}) {
  const response = await apiClient.get("/admin/users", { params })
  return response.data
}

export async function getUserById(id) {
  const response = await apiClient.get(`/admin/users/${id}`)
  return response.data
}

export async function createUser(user) {
  const response = await apiClient.post("/admin/users", user)
  return response.data
}

export async function updateUser(id, user) {
  const response = await apiClient.put(`/admin/users/${id}`, user)
  return response.data
}

export async function deleteUser(id) {
  await apiClient.delete(`/admin/users/${id}`)
}

export async function updateUserRole(id, role) {
  const response = await apiClient.patch(`/admin/users/${id}/role`, { role })
  return response.data
}

export async function setUserDisabled(id, disabled) {
  const response = await apiClient.patch(
    `/admin/users/${id}/disabled`,
    null,
    { params: { disabled } },
  )
  return response.data
}

export async function resetUserPassword(id, password) {
  await apiClient.patch(`/admin/users/${id}/password`, { password })
}
