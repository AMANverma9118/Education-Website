import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

import Home from './pages/public/Home.jsx';
import About from './pages/public/About.jsx';
import Contact from './pages/public/Contact.jsx';
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';

import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentGrades from './pages/student/StudentGrades.jsx';
import StudentAttendance from './pages/student/StudentAttendance.jsx';

import ParentDashboard from './pages/parent/ParentDashboard.jsx';
import ParentChildren from './pages/parent/ParentChildren.jsx';

import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import TeacherClasses from './pages/teacher/TeacherClasses.jsx';
import TeacherGrades from './pages/teacher/TeacherGrades.jsx';

import PrincipalDashboard from './pages/principal/PrincipalDashboard.jsx';
import PrincipalUsers from './pages/principal/PrincipalUsers.jsx';
import PrincipalClasses from './pages/principal/PrincipalClasses.jsx';
import PrincipalAnnouncements from './pages/principal/PrincipalAnnouncements.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="grades" element={<StudentGrades />} />
            <Route path="attendance" element={<StudentAttendance />} />
          </Route>

          <Route
            path="/parent"
            element={
              <ProtectedRoute roles={['parent']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParentDashboard />} />
            <Route path="children" element={<ParentChildren />} />
            <Route path="children/:childId" element={<ParentChildren />} />
          </Route>

          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={['teacher']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="classes" element={<TeacherClasses />} />
            <Route path="grades" element={<TeacherGrades />} />
          </Route>

          <Route
            path="/principal"
            element={
              <ProtectedRoute roles={['principal']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PrincipalDashboard />} />
            <Route path="users" element={<PrincipalUsers />} />
            <Route path="classes" element={<PrincipalClasses />} />
            <Route path="announcements" element={<PrincipalAnnouncements />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
