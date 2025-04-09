import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import Calendar from "./dashboard/pages/Calendar";
import BasicTables from "./dashboard/pages/Tables/BasicTables";
import FormElements from "./dashboard/pages/Forms/FormElements";
import Blank from "./dashboard/pages/Blank";
import AppLayout from "./dashboard/layout/AppLayout";
import { ScrollToTop } from "./dashboard/components/common/ScrollToTop";
import Home from "./dashboard/pages/Dashboard/Home";
import RequestReset from './dashboard/pages/AuthPages/RequestReset';
import ResetPassword from './dashboard/pages/AuthPages/ResetPassword';
import ProtectedRoute from "./ProtectedRoute";
import AuthSuccess from "./dashboard/AuthSuccess";
import Frontpage from "./home/Acceuil";

export default function App() {
  return (
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Auth Layout (No Protection) */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/request-reset" element={<RequestReset />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
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
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
  );
}
