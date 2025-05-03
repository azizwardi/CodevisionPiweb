import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ToastContainer from "./dashboard/components/ui/toast/ToastContainer";
import SignIn from "./dashboard/pages/AuthPages/SignIn";
import SignUp from "./dashboard/pages/AuthPages/SignUp";
import NotFound from "./dashboard/pages/OtherPage/NotFound";
import UserProfiles from "./dashboard/pages/UserProfiles";
import Videos from "./dashboard/pages/UiElements/Videos";
import Images from "./dashboard/pages/UiElements/Images";
import Alerts from "./dashboard/pages/UiElements/Alerts";
import Badges from "./dashboard/pages/UiElements/Badges";
import Avatars from "./dashboard/pages/UiElements/Avatars";
import Buttons from "./dashboard/pages/UiElements/Buttons";
import LineChart from "./dashboard/pages/Charts/LineChart";
import BarChart from "./dashboard/pages/Charts/BarChart";
// Task management imports
import TaskList from "./dashboard/pages/Tasks/TaskList";
import CreateTask from "./dashboard/pages/Tasks/CreateTask";
import EditTask from "./dashboard/pages/Tasks/EditTask";
// Chatbot import
import ChatbotPage from "./dashboard/pages/ChatbotPage";

import Calendar from "./dashboard/pages/Calendar";
import BasicTables from "./dashboard/pages/Tables/BasicTables";
import FormElements from "./dashboard/pages/Forms/FormElements";
import Blank from "./dashboard/pages/Blank";
import AppLayout from "./dashboard/layout/AppLayout";
import { ScrollToTop } from "./dashboard/components/common/ScrollToTop";
import Home from "./dashboard/pages/Dashboard/Home";
import RequestReset from './dashboard/pages/AuthPages/RequestReset';
import ResetPassword from './dashboard/pages/AuthPages/ResetPassword';
// import VerifyEmail from './dashboard/pages/AuthPages/VerifyEmail';
import DebugAuth from "./dashboard/pages/AuthPages/DebugAuth";
import Unauthorized from "./dashboard/pages/AuthPages/Unauthorized";
import UserRoleSelector from "./dashboard/components/auth/UserRoleSelector";

// Team Leader imports
import TeamLeaderHomeLayout from "./teamleader/layout/TeamLeaderHomeLayout";
import TeamLeaderDashboard from "./teamleader/pages/TeamLeaderDashboard";
import TeamLeaderProfile from "./teamleader/pages/TeamLeaderProfile";
import TeamLeaderProjects from "./teamleader/pages/TeamLeaderProjects";
import TeamLeaderTasks from "./teamleader/pages/TeamLeaderTasks";
import TeamLeaderCalendar from "./teamleader/pages/TeamLeaderCalendar";

// Member imports
import MemberHomeLayout from "./member/layout/MemberHomeLayout";
import MemberDashboard from "./member/pages/MemberDashboard";
import MemberProfile from "./member/pages/MemberProfile";
import MemberTasks from "./member/pages/MemberTasks";
import MemberProjects from "./member/pages/MemberProjects";
import MemberCalendar from "./member/pages/MemberCalendar";
import EditMemberTask from "./member/pages/EditMemberTask";
import ProtectedRoute from "./ProtectedRoute";
import AuthSuccess from "./dashboard/AuthSuccess";
import Frontpage from "./home/Acceuil";
import { NotificationProvider } from "./dashboard/components/notifications/NotificationContext";

export default function App() {
  return (
    <NotificationProvider>
      <Router>
        <ScrollToTop />
        <ToastContainer />
        <Routes>
          {/* Auth Layout (No Protection) */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/request-reset" element={<RequestReset />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/role-select" element={<UserRoleSelector />} />
          <Route path="/debug-auth" element={<DebugAuth />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/*" element={<Frontpage />} />

          <Route element={<AppLayout />}>
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route element={<AppLayout />}>
              <Route index path="/dashboard" element={ <Home />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/form-elements" element={<FormElements />} />
          <Route path="/basic-tables" element={<BasicTables />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />
          {/* Task management routes */}
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/create" element={<CreateTask />} />
          <Route path="/tasks/edit/:taskId" element={<EditTask />} />
          {/* Chatbot route */}
          <Route path="/assistant" element={<ChatbotPage />} />
        </Route>
      </Route>

          {/* Team Leader Routes */}
          <Route element={<ProtectedRoute requiredRole="TeamLeader" />}>
            <Route element={<TeamLeaderHomeLayout />}>
              <Route path="/team-leader-dashboard" element={<TeamLeaderDashboard />} />
              <Route path="/team-leader/profile" element={<TeamLeaderProfile />} />
              <Route path="/team-leader/team" element={<div />} />
              <Route path="/team-leader/projects" element={<TeamLeaderProjects />} />
              <Route path="/team-leader/tasks" element={<TeamLeaderTasks />} />
              <Route path="/team-leader/tasks/edit/:taskId" element={<EditTask />} />
              <Route path="/team-leader/calendar" element={<TeamLeaderCalendar />} />
              <Route path="/team-leader/reports" element={<div />} />
              <Route path="/team-leader/assistant" element={<ChatbotPage />} />
            </Route>
          </Route>

          {/* Member Routes */}
          <Route element={<ProtectedRoute requiredRole="Member" />}>
            <Route element={<MemberHomeLayout />}>
              <Route path="/member-dashboard" element={<MemberDashboard />} />
              <Route path="/member/profile" element={<MemberProfile />} />
              <Route path="/member/tasks" element={<MemberTasks />} />
              <Route path="/member/tasks/edit/:taskId" element={<EditMemberTask />} />
              <Route path="/member/projects" element={<MemberProjects />} />
              <Route path="/member/calendar" element={<MemberCalendar />} />
              <Route path="/member/time-tracking" element={<div />} />
              <Route path="/member/team-chat" element={<div />} />
              <Route path="/member/assistant" element={<ChatbotPage />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}
