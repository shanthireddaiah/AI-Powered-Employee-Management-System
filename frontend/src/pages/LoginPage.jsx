import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Lock, User, LogIn, AlertCircle, CheckCircle, Mail, UserPlus, KeyRound, ArrowLeft, ArrowRight, Check, RefreshCw, Sparkles } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // SignUp fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot Password Flow States
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Options, 4: Set New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFormState = () => {
    setError('');
    setSuccessMessage('');
    setShowPassword(false);
    setShowSignUpPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (newMode) => {
    resetFormState();
    setMode(newMode);
    if (newMode === 'forgot') {
      setForgotStep(1);
      setForgotEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setDevOtp('');
    }
  };

  // Password Complexity Validation Flags
  const isLengthValid = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\];']/.test(newPassword);
  const doMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordStrong = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecial && doMatch;

  const parseErrorMessage = (err, defaultMsg) => {
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (typeof data === 'string') {
        if (data.trim().startsWith('<') || data.length > 250) {
          return defaultMsg || 'An unexpected server error occurred. Please try again.';
        }
        return data;
      }
      if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const messages = keys.map(key => `${key}: ${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}`);
          return messages.join(' | ');
        }
      }
    }
    return defaultMsg || 'Failed to process request. Please try again.';
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetFormState();
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login/', { username, password });
      const { access, user } = res.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      onLoginSuccess(user);
    } catch (err) {
      console.error("Login failed:", err);
      setError(parseErrorMessage(err, 'Invalid username/email or password. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Sign Up
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    resetFormState();

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!firstName.trim() || !nameRegex.test(firstName.trim())) {
      setError('First Name must contain letters and spaces only.');
      return;
    }
    if (!lastName.trim() || !nameRegex.test(lastName.trim())) {
      setError('Last Name must contain letters and spaces only.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/signup/', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        department: department.trim() || 'Engineering',
        designation: designation.trim() || 'Software Engineer'
      });

      setSuccessMessage(res.data.message || 'Account created successfully! Please sign in with your Employee Code.');
      setUsername(email);
      switchMode('login');
    } catch (err) {
      console.error("Signup failed:", err);
      setError(parseErrorMessage(err, 'Failed to create account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. FORGOT PASSWORD STEP 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    resetFormState();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail.trim() || !emailRegex.test(forgotEmail.trim())) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/send-otp/', { email: forgotEmail.trim() });
      setSuccessMessage(res.data.message || `Verification code has been sent to ${forgotEmail.trim()}.`);
      setForgotStep(2);
    } catch (err) {
      console.error("Send OTP failed:", err);
      setError(parseErrorMessage(err, 'This email address is not registered.'));
    } finally {
      setLoading(false);
    }
  };

  // 4. FORGOT PASSWORD STEP 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    resetFormState();

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/verify-otp/', {
        email: forgotEmail.trim(),
        otp_code: otpCode.trim()
      });

      setSuccessMessage('Verification code verified successfully. Please choose how to proceed.');
      setForgotStep(3);
    } catch (err) {
      console.error("Verify OTP failed:", err);
      setError(parseErrorMessage(err, 'Invalid verification code.'));
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOTP = async () => {
    resetFormState();
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/send-otp/', { email: forgotEmail.trim() });
      setSuccessMessage(`New verification code sent to ${forgotEmail.trim()}.`);
    } catch (err) {
      setError(parseErrorMessage(err, 'Failed to resend verification code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // 5. FORGOT PASSWORD STEP 4 (Option 1): Reset Password
  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    resetFormState();

    if (!newPassword) {
      return handleOneTimeLogin();
    }

    if (!isPasswordStrong) {
      setError('Please ensure your new password meets all security requirements.');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/reset-password-otp/', {
        email: forgotEmail.trim(),
        otp_code: otpCode.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      await handleOneTimeLogin();
    } catch (err) {
      console.error("Reset password failed:", err);
      setError(parseErrorMessage(err, 'Failed to update password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // 6. FORGOT PASSWORD OPTION 2: One-Time Login
  const handleOneTimeLogin = async () => {
    resetFormState();
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/one-time-login/', {
        email: forgotEmail.trim(),
        otp_code: otpCode.trim()
      });

      const { access, user } = res.data;
      localStorage.setItem('token', access);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      onLoginSuccess(user);
    } catch (err) {
      console.error("One-time login failed:", err);
      setError(parseErrorMessage(err, 'Verification code expired or invalid for one-time login.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F7F4EF',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(217, 119, 6, 0.05) 0px, transparent 50%)',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '460px',
        maxWidth: '100%',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
          }}>
            {mode === 'signup' ? (
              <UserPlus size={28} color="white" />
            ) : mode === 'forgot' ? (
              <KeyRound size={28} color="white" />
            ) : (
              <Shield size={28} color="white" />
            )}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.35rem' }}>
            {mode === 'signup' 
              ? 'Create HRMS Account' 
              : mode === 'forgot' 
              ? (forgotStep === 1 ? 'Forgot Password' : forgotStep === 2 ? 'Enter Verification Code' : forgotStep === 3 ? 'Verification Successful' : 'Create New Password')
              : 'HRMS Smart AI'}
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            {mode === 'signup' 
              ? 'Sign up to register your staff profile' 
              : mode === 'forgot' 
              ? (forgotStep === 1 
                  ? 'Enter your registered email address to receive a 6-digit code' 
                  : forgotStep === 2 
                  ? `Enter the 6-digit verification code sent to your email` 
                  : forgotStep === 3 
                  ? 'Choose how you would like to proceed' 
                  : 'Set a strong new password for your account')
              : 'Enterprise Authentication Portal'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div style={{
            background: '#DCFCE7',
            border: '1px solid #BBF7D0',
            color: '#15803D',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}>
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                Username or Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Enter username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    background: '#FFFFFF !important',
                    border: '1px solid #D1D5DB !important',
                    borderRadius: '8px',
                    color: '#111827 !important',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', color: '#64748B', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 3.8rem 0.75rem 2.5rem',
                    background: '#FFFFFF !important',
                    border: '1px solid #D1D5DB !important',
                    borderRadius: '8px',
                    color: '#111827 !important',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0 0.25rem',
                    userSelect: 'none',
                    zIndex: 2
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Forgot Password Link Below Password Box */}
              <div style={{ textAlign: 'right', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                transition: 'background 0.2s ease'
              }}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: '700', cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shanthi"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reddaiah"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="email"
                  placeholder="e.g. shanthi@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                Password *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748B', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 3.8rem 0.65rem 2.4rem', borderRadius: '8px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0 0.25rem',
                    userSelect: 'none',
                    zIndex: 2
                  }}
                >
                  {showSignUpPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                  Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Developer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
            >
              <UserPlus size={18} />
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', fontSize: '0.875rem', color: '#6B7280' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: '700', cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD FLOW */}
        {mode === 'forgot' && (
          <div>
            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                    Registered Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="email"
                      placeholder="e.g. shanthi.reddaiah@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        color: '#111827',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#F3F4F6',
                      color: '#374151',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: '0.75rem',
                      background: '#2563EB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Mail size={16} />
                    <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter Verification Code */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                    Verification Code *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit code (e.g. 483927)"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        background: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        color: '#111827',
                        fontSize: '1.05rem',
                        letterSpacing: '3px',
                        fontWeight: '700',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      background: '#2563EB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <RefreshCw size={14} /> Resend Code
                    </button>

                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: Create New Password (on top) with Save Password & Continue & Skip buttons (below) */}
            {(forgotStep === 3 || forgotStep === 4) && (
              <form onSubmit={handleSaveNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                    New Password (Optional)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748B', pointerEvents: 'none', zIndex: 1 }} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter strong new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 3.8rem 0.65rem 2.4rem', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748B', pointerEvents: 'none', zIndex: 1 }} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 3.8rem 0.65rem 2.4rem', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '-0.25rem 0 0.25rem 0' }}>
                  Must be min 8 chars with uppercase (A-Z), lowercase (a-z), number (0-9), & special char (!@#$%).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.25rem' }}>
                  <button
                    type="submit"
                    disabled={loading || (newPassword.length > 0 && !isPasswordStrong)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      background: (newPassword.length === 0 || isPasswordStrong) ? '#2563EB' : '#94A3B8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      cursor: (newPassword.length === 0 || isPasswordStrong) && !loading ? 'pointer' : 'not-allowed',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Password & Continue'}
                  </button>

                  <button
                    type="button"
                    onClick={handleOneTimeLogin}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      background: '#FFFFFF',
                      color: '#374151',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ArrowRight size={18} color="#6B7280" />
                    <span>{loading ? 'Logging in...' : 'Skip'}</span>
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.15rem' }}>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
