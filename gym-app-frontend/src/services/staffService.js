import apiClient from "./apiClient.js"

export async function getStaffRegistrations(status) {
  const response = await apiClient.get("/staff/registrations", {
    params: status ? { status } : {},
  })
  return response.data
}

export async function processRegistration(id, data) {
  const response = await apiClient.patch(
    `/staff/registrations/${id}/process`,
    data,
  )
  return response.data
}

export async function confirmClassCancellation(id, staffId) {
  const response = await apiClient.patch(
    `/staff/registrations/${id}/confirm-cancellation`,
    null,
    { params: { staffId } },
  )
  return response.data
}

export async function getRecruitingClassroomsForStaff() {
  const response = await apiClient.get("/public/classrooms")
  return response.data
}

export async function getPaymentCollections() {
  const response = await apiClient.get("/staff/payments")
  return response.data
}

export async function recordPayment(payment) {
  const response = await apiClient.post("/staff/payments/record", payment)
  return response.data
}

export async function enrollRegistration(registrationId) {
  const response = await apiClient.post(`/staff/payments/enroll/${registrationId}`)
  return response.data
}

export async function getStaffFreezeRequests(status) {
  const response = await apiClient.get("/staff/freeze-requests", {
    params: status ? { status } : {},
  })
  return response.data
}

export async function processFreezeRequest(id, data) {
  const response = await apiClient.patch(`/staff/freeze-requests/${id}/process`, data)
  return response.data
}

export async function getStaffMakeupRequests(status) {
  const response = await apiClient.get("/staff/makeup-requests", {
    params: status ? { status } : {},
  })
  return response.data
}

export async function processMakeupRequest(id, data) {
  const response = await apiClient.patch(`/staff/makeup-requests/${id}/process`, data)
  return response.data
}
