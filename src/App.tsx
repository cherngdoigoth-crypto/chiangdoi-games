import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { canReview, isAdmin } from '@domain';
import { PublicLayout, RequireRole, StaffLayout } from './components/Layout';
import { PublicDataProvider } from './state/live';
import { POLL_STAFF_MS } from './lib/api';
import Login, { ChangePassword } from './pages/Login';
import CupPage from './pages/public/CupPage';
import ResultsPage from './pages/public/ResultsPage';
import Display from './pages/public/Display';
import Dashboard from './pages/staff/Dashboard';
import Competitions from './pages/staff/Competitions';
import CompetitionDetail from './pages/staff/CompetitionDetail';
import ScoreList from './pages/staff/ScoreList';
import ScoreEntry from './pages/staff/ScoreEntry';
import Review from './pages/staff/Review';
import Publication from './pages/staff/Publication';
import Users from './pages/staff/Users';
import Reports from './pages/staff/Reports';
import Account from './pages/staff/Account';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<CupPage mode="public" />} />
          <Route path="results" element={<ResultsPage mode="public" />} />
        </Route>
        <Route path="display" element={<PublicDataProvider keepWhenHidden interval={Math.max(POLL_STAFF_MS, 5000)}><Display /></PublicDataProvider>} />
        <Route path="login" element={<Login />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="staff" element={<StaffLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="score" element={<ScoreList />} />
          <Route path="score/:id" element={<ScoreEntry />} />
          <Route path="review" element={<RequireRole allow={canReview}><Review /></RequireRole>} />
          <Route path="review/:id" element={<RequireRole allow={canReview}><Review /></RequireRole>} />
          <Route path="results" element={<ResultsPage mode="staff" />} />
          <Route path="cup" element={<CupPage mode="staff" />} />
          <Route path="competitions" element={<RequireRole allow={isAdmin}><Competitions /></RequireRole>} />
          <Route path="competitions/:id" element={<RequireRole allow={isAdmin}><CompetitionDetail /></RequireRole>} />
          <Route path="publication" element={<RequireRole allow={isAdmin}><Publication /></RequireRole>} />
          <Route path="users" element={<RequireRole allow={isAdmin}><Users /></RequireRole>} />
          <Route path="reports" element={<Reports />} />
          <Route path="account" element={<Account />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
