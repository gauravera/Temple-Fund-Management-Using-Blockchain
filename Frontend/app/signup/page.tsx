"use client";

import { useState, ClipboardEvent, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Phone,
  Mail,
  User,
  Wallet,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useMetamask } from "../hooks/useMetamask";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
export default function TempleFundSignup() {
  const router = useRouter();

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (accessToken) {
      router.push("/user/dashboard");
    }
  }, [router]);

  const {
    account,
    error,
    connectWallet
  } = useMetamask();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

// Runs ONLY when step changes
useEffect(() => {
  if (currentStep === 3 && !account) {
    // Don't call connectWallet automatically!
    // Just prepare to show Connect button
    console.log("Ready to connect wallet (step 3)");
  }
}, [currentStep]);


  // Validation functions
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
  const validatePassword = (password: string) =>
    password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  const validateName = (name: string) =>
    name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);

  // Step 1: User Details Validation
  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!validateName(name)) {
      newErrors.name =
        "Name must be at least 2 characters and contain only letters";
    }

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!validateMobile(phone)) {
      newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
    }

    if (!validatePassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters with uppercase, lowercase, and number";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the highlighted errors before proceeding.");
      return false;
    }

    return true;
  };

  // Handle OTP input
  interface OtpChangeEvent extends React.ChangeEvent<HTMLInputElement> {}

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp: string[] = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput: HTMLElement | null = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (pastedData.length === 6) { // Ensure the pasted data is exactly 6 digits
      const newOtp = pastedData.split("");
      setOtp(newOtp);

      // Auto-focus the last input field
      const lastInput = document.getElementById(`otp-${newOtp.length - 1}`);
      if (lastInput) lastInput.focus();
    } else {
      toast.error("Please paste a valid 6-digit OTP.");
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };


  const handleNext = async () => {
  if (currentStep === 1) {
    if (validateStep1()) await handleRegister(); // move to step 2
  } else if (currentStep === 2) {
    await handleVerifyOtp(); // move to step 3
  } else if (currentStep === 3) {
    await handleConnectWallet(); // get wallet address only
  } else if (currentStep === 4) {
    await handleConfirmRegister(); // push to DB
  }
};


  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const handleRegister = async () => {
    if (!validateStep1()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5050/api/v1/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, password }),
      })

      const result = await response.json();
      console.log("Registration result:", result);

      if (!response.ok) {
        toast.error(result.message || "Failed to register. Please try again.");
        return;
      }

      if (result.success) {
        toast.success("Registration successful! Please check your email for OTP.");
        setCurrentStep(2);
      }

    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred while registering. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Simulate OTP verification
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5050/api/v1/users/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpString }),
        credentials: "include"
      });

      const result = await response.json();
      console.log("OTP verification result:", result);

      if (!response.ok) {
        toast.error(result.message || "OTP verification failed. Please try again.");
        return;
      }

      if (result.success) {
        toast.success("OTP verified successfully!");

        // Store tokens and user data
        sessionStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        localStorage.setItem("user_data", JSON.stringify(result.data.user));

        setCurrentStep(3);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An error occurred while verifying OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }

  };

  const handleConnectWallet = async () => {
  setIsLoading(true);
  try {
    const connectedAddress = await connectWallet();
    if (!connectedAddress) {
      toast.error("Failed to connect MetaMask wallet.");
      return;
    }

    toast.success("Wallet connected!");
    setCurrentStep(4); // or any other logic you use after connecting
  } catch (error) {
    console.error(error);
    toast.error("Unexpected error while connecting wallet.");
  } finally {
    setIsLoading(false);
  }
};


  const handleConfirmRegister = async () => {
  setIsLoading(true);
  try {
    const accessToken = sessionStorage.getItem("accessToken");
    const response = await fetch("http://localhost:5050/api/v1/users/store-wallet-address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ walletAddress: account }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.message || "Error saving wallet address.");
      return;
    }

    if (result.success) {
      toast.success("Wallet address stored successfully!");
      router.push("/user/dashboard");
    }
  } catch (error) {
    console.error(error);
    toast.error("Unexpected error while saving wallet address.");
  } finally {
    setIsLoading(false);
  }
};


  const handleResendOtp = async () => {
    if (!email) {
      toast.error("please provide a valid email address.")
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5050/api/v1/users/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log("Resend OTP result:", result);

      if (!response.ok) {
        toast.error(result.message || "Failed to resend OTP. Please try again.");
        return;
      }

      if (result.success) {
        toast.success("OTP resent successfully! Please check your email.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("An error occurred while resending OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-orange-100">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-orange-100">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* Outer glow ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-30 animate-pulse"></div>

            {/* Outer animated dashed ring — bigger and thicker */}
            <div
              className="absolute inset-0 rounded-full border-4 border-dashed border-orange-300 animate-spin"
              style={{ animation: "spin 20s linear infinite" }}
            ></div>

            {/* Wrapper for Main Logo Circle */}
            <div className="absolute inset-2 flex items-center justify-center">
              {/* Main logo circle */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                {/* Inner gradient overlay */}
                <div className="absolute inset-1 bg-gradient-to-t from-transparent to-white opacity-20 rounded-full"></div>
                {/* Om symbol */}
                <span className="relative text-white text-3xl font-bold drop-shadow-lg transform hover:scale-110 transition-transform duration-300">
                  ॐ
                </span>
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-md animate-bounce"></div>
                <div
                  className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full shadow-md animate-bounce"
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

        {/* Progress Bar */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {currentStep > step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 w-16 mx-2 ${currentStep > step ? "bg-orange-500" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 pb-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Personal Information
              </h2>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Mobile Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none ${errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Verify Email Id
              </h2>
              <p className="text-gray-600">
                We've sent a 6-digit OTP to {email}
              </p>

              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    maxLength={1}
                  />
                ))}
              </div>

              {errors.otp && (
                <p className="text-red-500 text-sm">{errors.otp}</p>
              )}

              <p className="text-sm text-gray-500">
                Didn't receive the code?
                <button
                  onClick={handleResendOtp}
                  className="text-orange-500 hover:text-orange-600 ml-1 font-medium">
                  Resend OTP
                </button>
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Connect Your Wallet
              </h2>
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-10 h-10 text-white" />
              </div>

              {!account ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Connect your crypto wallet to manage temple donations
                    securely
                  </p>
                  {errors.wallet && (
                    <p className="text-red-500 text-sm mb-4">{errors.wallet}</p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">
                    Wallet Connected Successfully!
                  </p>
                  <p className="text-sm text-gray-600 mt-1 break-all">
                    {account}
                  </p>
                </div>
              )}
            </div>
          )}

{currentStep === 4 && (
  <div className="text-center space-y-6">
    <h2 className="text-xl font-semibold text-gray-800">
      Final Step
    </h2>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-700 font-medium">
        Click below to save your wallet address and complete registration.
      </p>
      <p className="text-sm text-gray-600 mt-1 break-all">
        {account}
      </p>
    </div>
  </div>
)}


          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isLoading}
              className={`flex items-center px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 font-medium ${currentStep === 1 ? "ml-auto" : ""
                }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <>
                  {currentStep === 4 && account
                    ? "Complete Registration"
                    : currentStep === 3
                      ? "Connect Wallet"
                      : currentStep === 2
                        ? "Verify OTP"
                        : "Continue"}
                  {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
