"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useMetamask } from "../hooks/useMetamask";
import LogoutButton from "./LogoutButton";
import { jwtDecode } from "jwt-decode";
import {
  LogOut,
  Wallet,
  ChevronDown,
  UserCircle,
  Bell,
  Settings,
} from "lucide-react";

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { account, connectWallet, loading } = useMetamask();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showConnectedButton, setShowConnectedButton] = useState(false); // 👈 for delayed button show
  const [userEmail, setUserEmail] = useState("admin@example.com");

  const handleChangePassword = () => {
    alert("Change password functionality");
  };
  const notifications = [
    {
      id: 1,
      title: "New Donation Received",
      message: "₹25,000 donation from Rajesh Sharma",
      time: "2 minutes ago",
      type: "donation",
      unread: true,
    },
    {
      id: 2,
      title: "Campaign Goal Reached",
      message: "Temple Kitchen Expansion campaign completed",
      time: "1 hour ago",
      type: "campaign",
      unread: true,
    },
    {
      id: 3,
      title: "Event Reminder",
      message: "Ram Navami celebration tomorrow",
      time: "3 hours ago",
      type: "event",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      const decoded = jwtDecode<{ email: string }>(token);
      setUserEmail(decoded.email);
    }
  }, []);

  // Delayed Connect Wallet button if not connected
  useEffect(() => {
    if (account) {
      const timer = setTimeout(() => {
        setShowConnectedButton(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowConnectedButton(false);
    }
  }, [account]);

  const slideFade = {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const fadeIn = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 mb cursor-pointer">
                {/*Logo*/}

                <div className="relative w-12 h-12">
                  {/* Pulsing outer ring */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-30 animate-pulse"></div>

                  {/* Spinning dashed border */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-orange-300 animate-spin"
                    style={{ animation: "spin 20s linear infinite" }}
                  ></div>

                  {/* Inner glowing circle with ॐ symbol */}
                  <div className="absolute inset-1 flex items-center justify-center">
                    <div className="relative w-9 h-9 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl border border-white">
                      <div className="absolute inset-0.5 bg-gradient-to-t from-transparent to-white opacity-20 rounded-full"></div>
                      <span className="relative text-white text-xl font-bold drop-shadow-lg transform hover:scale-110 transition-transform duration-300">
                        ॐ
                      </span>

                      {/* Glowing dots */}
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full shadow-md animate-bounce"></div>
                      <div
                        className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-md animate-bounce"
                        style={{ animationDelay: "0.5s" }}
                      ></div>
                    </div>
                  </div>

                  {/* Soft bottom glow */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-9 h-4 bg-gradient-to-t from-orange-200 to-transparent rounded-full opacity-40 blur-sm"></div>
                </div>

                {/*Logo End*/}
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Digital Seva
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Wallet + Dropdown */}
          <div className="flex items-center space-x-4">
            <AnimatePresence>
              {!account && (
                <motion.button
                  key="connectwalletbutton"
                  onClick={connectWallet}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeIn}
                  transition={{ duration: 0.4 }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  <span>
                    {loading ? "Checking Wallet..." : "Connect Wallet"}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            {account && showConnectedButton && (
              <motion.button
                key="connectedwalletbutton"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={fadeIn}
                transition={{ duration: 0.4 }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>{`Connected: ${account.slice(0, 6)}...${account.slice(
                  -4
                )}`}</span>
              </motion.button>
            )}

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">
                      Notifications
                    </h3>
                    <p className="text-sm text-gray-600">
                      {unreadCount} unread notifications
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        whileHover={{ backgroundColor: "#f9fafb" }}
                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer ${notification.unread ? "bg-orange-50" : ""
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${notification.unread
                              ? "bg-orange-500"
                              : "bg-gray-300"
                              }`}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button className="text-orange-500 text-sm font-medium hover:text-orange-600">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <UserCircle className="w-8 h-8" />
                <ChevronDown className="w-4 h-4" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {/* Account Details */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-gray-800">Admin User</p>
                      <p className="text-gray-600">{userEmail}</p>
                      <p className="text-gray-500">Temple Administrator</p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={handleChangePassword}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Change Password</span>
                    </button>
                    <LogoutButton
                      logoutUrl="http://localhost:5050/api/v1/templeAdmin/logout-Temple-Admin"
                      redirectTo="/templelogin"
                      onLogoutClick={() => setShowUserDropdown(false)} // close dropdown immediately on click
                    >
                      <div className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </div>
                    </LogoutButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
