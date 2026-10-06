import { createContext, useContext, useMemo, useState } from "react"

const AuthContext = createContext(null)

const roleHome = {
  admin: "/admin",
  staff: "/staff",
  trainer: "/trainer/classes",
  member: "/member/classes",
}

const backendRoleMapping = {
  ADMIN: "admin",
  STAFF: "staff",
  TRAINER: "trainer",
  MEMBER: "member",
}

const validRoles = new Set(["admin", "staff", "trainer", "member"])

function normalizeUser(backendUser) {
  const backendRole = String(backendUser.role || "").toUpperCase()
  const role = backendRoleMapping[backendRole] || backendUser.role

  if (!validRoles.has(role)) {
    throw new Error("Tai khoan chua duoc gan quyen hop le.")
  }

  return {
    id: backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    phoneNumber: backendUser.phoneNumber,
    role,
  }
}

function readStoredUser() {
  // Xóa session cũ còn lưu trong localStorage (nếu có từ phiên bản trước)
  localStorage.removeItem("gym-user")
  localStorage.removeItem("gym-token")

  try {
    const storedUser = sessionStorage.getItem("gym-user")
    const token = sessionStorage.getItem("gym-token")
    if (!storedUser || !token) {
      sessionStorage.removeItem("gym-user")
      sessionStorage.removeItem("gym-token")
      return null
    }

    const parsedUser = JSON.parse(storedUser)

    if (!validRoles.has(parsedUser?.role) || !parsedUser?.email) {
      sessionStorage.removeItem("gym-user")
      sessionStorage.removeItem("gym-token")
      return null
    }

    return parsedUser
  } catch {
    sessionStorage.removeItem("gym-user")
    sessionStorage.removeItem("gym-token")
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const syncUser = (authData) => {
    const token = authData?.token
    const backendUser = authData?.user || authData
    const nextUser = normalizeUser(backendUser)

    if (token) {
      sessionStorage.setItem("gym-token", token)
    }

    sessionStorage.setItem("gym-user", JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  const login = (authData) => syncUser(authData)

  const logout = () => {
    sessionStorage.removeItem("gym-token")
    sessionStorage.removeItem("gym-user")
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout, syncUser }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}

export function getRoleHome(role) {
  return roleHome[role] || "/login"
}
