import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Home from './pages/Dashboard/Home';
import Income from './pages/Dashboard/Income';
import Expense from './pages/Dashboard/Expense';
import Suggestions from './pages/Dashboard/Suggestions';
import Profile from './pages/Profile/Profile';

export function App() {
  return (
    <div className="app">
      <AuthProvider>
        <DashboardProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Root />} />
              <Route path="/login" exact element={<Login />} />
              <Route path="/SignUp" exact element={<SignUp />} />
              <Route path="/forgot-password" exact element={<ForgotPassword />} />
              <Route path="/reset-password" exact element={<ResetPassword />} />
              <Route path="/dashboard" exact element={<Home />} />
              <Route path = '/income' exact element = {<Income />} ></Route>
              <Route path = '/expense' exact element = {<Expense />} ></Route>
              <Route path = '/suggestions' exact element = {<Suggestions />} ></Route>
              <Route path = '/profile' exact element = {<Profile />} ></Route>
            
          
              </Routes>
            </Router>
          </DashboardProvider>
        </AuthProvider>
    </div>
  )
};

export default App;

const Root = () => {
  const { token } = useAuth();

  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
}

