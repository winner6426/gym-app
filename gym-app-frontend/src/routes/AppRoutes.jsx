import { Navigate, Route, Routes } from "react-router-dom"
import { DashboardLayout } from "../components/layout/DashboardLayout.jsx"
import Home from "../pages/Home.jsx"
import Login from "../pages/Login.jsx"
import Profile from "../pages/Profile.jsx"
import Register from "../pages/Register.jsx"
import AdminDashboard from "../pages/admin/Dashboard.jsx"
import Centers from "../pages/admin/Centers.jsx"
import Courses from "../pages/admin/Courses.jsx"
import Classrooms from "../pages/admin/Classrooms.jsx"
import Users from "../pages/admin/Users.jsx"
import StaffDashboard from "../pages/staff/Dashboard.jsx"
import StaffClassCancellationRequests from "../pages/staff/ClassCancellationRequests.jsx"
import StaffFreezeRequests from "../pages/staff/FreezeRequests.jsx"
import StaffMakeupRequests from "../pages/staff/MakeupRequests.jsx"
import StaffPayments from "../pages/staff/Payments.jsx"
import Attendance from "../pages/trainer/Attendance.jsx"
import TrainerClasses from "../pages/trainer/MyClasses.jsx"
import CourseRegistration from "../pages/member/CourseRegistration.jsx"
import MakeupClass from "../pages/member/MakeupClass.jsx"
import MemberClasses from "../pages/member/MyClasses.jsx"
import Payments from "../pages/member/Payments.jsx"
import Reservation from "../pages/member/Reservation.jsx"
import ResumeCourse from "../pages/member/ResumeCourse.jsx"
import { ProtectedRoute } from "./ProtectedRoute.jsx"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<DashboardLayout />}>
          <Route index element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="centers" element={<Centers />} />
          <Route path="users" element={<Users />} />
          <Route path="classrooms" element={<Classrooms />} />
          <Route path="courses" element={<Courses />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
        <Route path="/trainer" element={<DashboardLayout />}>
          <Route index element={<Navigate to="classes" replace />} />
          <Route path="classes" element={<TrainerClasses />} />
          <Route path="attendance" element={<Attendance />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
        <Route path="/staff" element={<DashboardLayout />}>
          <Route index element={<StaffDashboard />} />
          <Route path="payments" element={<StaffPayments />} />
          <Route path="cancellation-requests" element={<StaffClassCancellationRequests />} />
          <Route path="freeze-requests" element={<StaffFreezeRequests />} />
          <Route path="makeup-requests" element={<StaffMakeupRequests />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["member"]} />}>
        <Route path="/member" element={<DashboardLayout />}>
          <Route index element={<Navigate to="classes" replace />} />
          <Route path="classes" element={<MemberClasses />} />
          <Route path="courses" element={<Navigate to="/member/classes" replace />} />
          <Route path="payments" element={<Payments />} />
          <Route path="course-registration" element={<CourseRegistration />} />
          <Route path="makeup-class" element={<MakeupClass />} />
          <Route path="reservation" element={<Reservation />} />
          <Route path="resume-course" element={<ResumeCourse />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
