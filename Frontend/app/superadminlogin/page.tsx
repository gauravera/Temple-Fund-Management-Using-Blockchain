"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SuperAdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [fieldValidation, setFieldValidation] = useState({
    email: false,
    password: false
  });

  useEffect(() => {
    // Check if user is already logged in
    const accessToken = sessionStorage.getItem("accessToken");
    if (accessToken) {
      router.push("/superadmin/dashboard");
    }
  }, [router]);

  interface FormData {
    email: string;
    password: string;
  }

  interface FieldValidation {
    email: boolean;
    password: boolean;
  }

  interface InputChangeEvent extends React.ChangeEvent<HTMLInputElement> {}

  const handleInputChange = (e: InputChangeEvent): void => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation
    if (name === 'email') {
      setFieldValidation((prev: FieldValidation) => ({
        ...prev,
        email: value.includes('@') && value.includes('.')
      }));
    }
    if (name === 'password') {
      setFieldValidation((prev: FieldValidation) => ({
        ...prev,
        password: value.length >= 6
      }));
    }
    
    if (error) setError('');
  };

  const handleLogin = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5050/api/v1/superAdmin/login-superAdmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || "Login failed");
        return;
      }

      toast.success("Logged in successfully!");
      sessionStorage.setItem("accessToken", result.data.accessToken);
      localStorage.setItem("refreshToken", result.data.refreshToken);
      localStorage.setItem("user_data", JSON.stringify(result.data.user));

      router.push("/superadmin/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert(
      "Password reset instructions will be sent to your registered email address."
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-blue-100">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* Outer glow ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-30 animate-pulse"></div>

            {/* Outer animated dashed ring — bigger and thicker */}
            <div
              className="absolute inset-0 rounded-full border-4 border-dashed border-violate-300 animate-spin"
              style={{ animation: "spin 20s linear infinite" }}
            ></div>

            {/* Wrapper for Main Logo Circle */}
            <div className="absolute inset-2 flex items-center justify-center">
              {/* Main logo circle */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                {/* Inner gradient overlay */}
                <div className="absolute inset-1 bg-gradient-to-t from-transparent to-white opacity-20 rounded-full"></div>
                {/* Om symbol */}
                <span className="relative text-white text-3xl font-bold drop-shadow-lg transform hover:scale-110 transition-transform duration-300">
                  ॐ
                </span>
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full shadow-md animate-bounce"></div>
                <div
                  className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-300 rounded-full shadow-md animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </div>
            </div>

            {/* Bottom reflection */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-gradient-to-t from-orange-200 to-transparent rounded-full opacity-40 blur-sm"></div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Temple Fund Management
          </h1>
          <p className="text-gray-600 text-sm">
            Decentralized Donation Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="relative">
          {/* Card Background with subtle animation */}
          <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-gray-100" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl" />
          
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Secure Login</h2>
                  <p className="text-blue-100 text-sm">Enter your credentials to continue</p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  {/* Animated Border */}
                  <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                    focusedField === 'email' 
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-0.5' 
                      : 'bg-gray-200 p-0.5'
                  }`}>
                    <div className="w-full h-full bg-white rounded-lg" />
                  </div>
                  
                  {/* Glowing Effect */}
                  {focusedField === 'email' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 blur-sm animate-pulse" />
                  )}
                  
                  {/* Input Container */}
                  <div className="relative flex items-center">
                    <Mail className={`absolute left-4 w-5 h-5 z-10 transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className="relative w-full pl-12 pr-12 py-4 bg-transparent border-0 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 z-10"
                      placeholder="admin@temple.gov.in"
                      required
                    />
                    {fieldValidation.email && (
                      <CheckCircle2 className="absolute right-4 w-5 h-5 text-green-500 z-10" />
                    )}
                  </div>
                  
                  {/* Floating Animation */}
                  {focusedField === 'email' && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" 
                           style={{ 
                             animation: 'shimmer 2s infinite',
                             background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)'
                           }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  {/* Animated Border */}
                  <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                    focusedField === 'password' 
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-0.5' 
                      : 'bg-gray-200 p-0.5'
                  }`}>
                    <div className="w-full h-full bg-white rounded-lg" />
                  </div>
                  
                  {/* Glowing Effect */}
                  {focusedField === 'password' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-red-400/20 blur-sm animate-pulse" />
                  )}
                  
                  {/* Input Container */}
                  <div className="relative flex items-center">
                    <Lock className={`absolute left-4 w-5 h-5 z-10 transition-colors duration-300 ${
                      focusedField === 'password' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className="relative w-full pl-12 pr-16 py-4 bg-transparent border-0 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 z-10"
                      placeholder="Enter your secure password"
                      required
                    />
                    <div className="absolute right-4 flex items-center gap-2 z-10">
                      {fieldValidation.password && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-purple-600 transition-colors duration-300 p-1 rounded-lg hover:bg-purple-50"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Floating Animation */}
                  {focusedField === 'password' && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" 
                           style={{ 
                             animation: 'shimmer 2s infinite',
                             background: 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.1), transparent)'
                           }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading || !formData.email || !formData.password}
                className="relative w-full group overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Dashboard</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </div>
                
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>

              {/* Forgot Password */}
              <div className="text-center pt-4">
                <button
                  onClick={handleForgotPassword}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 relative group px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  <span className="relative">Forgot your password?</span>
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-gray-600 font-medium">© 2025 Temple Fund Management System</p>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Protected by Advanced Blockchain Security</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </div>
  );
}