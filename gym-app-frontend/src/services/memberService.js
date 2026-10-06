import apiClient from "./apiClient.js"

export async function getRecruitingClassrooms() {
  const response = await apiClient.get("/public/classrooms")
  return response.data
}

export async function getMyRegistrations(userId) {
  const response = await apiClient.get("/member/registrations", {
    params: { userId },
  })
  return response.data
}

export async function createRegistration(registration) {
  const response = await apiClient.post("/member/registrations", registration)
  return response.data
}

export async function cancelRegistration(id, userId) {
  const response = await apiClient.patch(
    `/member/registrations/${id}/cancel`,
    null,
    { params: { userId } },
  )
  return response.data
}

export async function getMyCards(userId) {
  const response = await apiClient.get("/member/cards", {
    params: { userId },
  })
  return response.data
}

export async function requestClassCancellation(cardId, userId) {
  const response = await apiClient.patch(
    `/member/cards/${cardId}/cancellation-request`,
    null,
    { params: { userId } },
  )
  return response.data
}

// ─── Makeup (học bù) ────────────────────────────────────────────────────────

export async function getAvailableClassroomsForMakeup(userId) {
  const response = await apiClient.get("/member/makeup/available-classrooms", {
    params: { userId },
  })
  return response.data
}



export async function getMyPayments(userId) {
  const response = await apiClient.get("/member/payments", {
    params: { userId },
  })
  return response.data
}

export async function getTravelClassrooms({ userId, cardId, province }) {
  const response = await apiClient.get("/member/travel-classrooms", {
    params: { userId, cardId, province },
  })
  return response.data
}

export async function transferClassroom({ userId, cardId, targetClassroomId }) {
  const response = await apiClient.patch("/member/travel-classrooms/transfer", null, {
    params: { userId, cardId, targetClassroomId },
  })
  return response.data
}

export async function getMyFreezeRequests(userId, status) {
  const response = await apiClient.get("/member/freeze-requests", {
    params: { userId, status },
  })
  return response.data
}

export async function createFreezeRequest(request) {
  const response = await apiClient.post("/member/freeze-requests", request)
  return response.data
}

export async function getResumeClassrooms({ userId, freezeRequestId, province }) {
  const response = await apiClient.get(`/member/freeze-requests/${freezeRequestId}/resume-options`, {
    params: { userId, province },
  })
  return response.data
}

export async function resumeFreezeRequest(id, request) {
  const response = await apiClient.patch(`/member/freeze-requests/${id}/resume`, request)
  return response.data
}

export async function getMyMakeupRequests(userId) {
  const response = await apiClient.get("/member/makeup", {
    params: { userId },
  })
  return response.data
}

export async function createMakeupRequest(request) {
  const response = await apiClient.post("/member/makeup", request)
  return response.data
}
