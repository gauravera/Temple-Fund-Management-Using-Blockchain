"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetamask } from "@/app/hooks/useMetamask";
import { useRouter } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import AuthWrapper from "@/app/components/AuthWrapper";
import { toast } from "react-toastify";

import {
  Home,
  Heart,
  History,
  TrendingUp,
  Settings,
  Bell,
  Search,
  Filter,
  Plus,
  LogOut,
  Wallet,
  ChevronDown,
  UserCircle,
  Eye,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Download,
  Share2,
  Star,
  Award,
  Clock,
  CheckCircle,
  ArrowRight,
  HandHeart,
  ExternalLink,
  XCircle,
} from "lucide-react";

const UserDashboard = () => {
  const router = useRouter();
  const { account, connectWallet, loading } = useMetamask();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showConnectedButton, setShowConnectedButton] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [recentDonations, setRecentDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState<{
    txHash: string;
    _id: string;
    receiver: any;
    sender?: any;
    purpose: string;
    amount: number;
    status: string;
    date: string;
  } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [userTotalDonations, setUserTotalDonations] = useState(0);
  const [maticToInr, setMaticToInr] = useState(0);
  const [monthlyDonationStats, setMonthlyDonationStats] = useState(0);

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

  useEffect(() => {
    const fetchUserTotalDonations = async () => {
      const token = sessionStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await fetch(
          "http://localhost:5050/api/v1/transactions/total-donation-done",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (data.success) {
          setUserTotalDonations(data.data.totalMATIC);
        }
      } catch (err) {
        console.error("Failed to fetch user's donation total:", err);
      }
    };

    fetchUserTotalDonations();
  }, []);

  useEffect(() => {
    const fetchMaticToINR = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=inr"
        );
        const data = await res.json();
        setMaticToInr(data["matic-network"]?.inr || 0);
      } catch (error) {
        console.error("Error fetching MATIC to INR:", error);
        setMaticToInr(90); // fallback
      }
    };

    fetchMaticToINR();
  }, []);

  useEffect(() => {
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchVerifiedCount = async () => {
      try {
        const response = await fetch(
          "http://localhost:5050/api/v1/superAdminDashboard/count-temple-admins"
        );
        const result = await response.json();
        setVerifiedCount(result.data.verifiedCount || 0);
      } catch (error) {
        console.error("Error fetching verified temple count:", error);
      }
    };

    fetchVerifiedCount();
  }, []);

  useEffect(() => {
    const fetchMyDonations = async () => {
      const accessToken = sessionStorage.getItem("accessToken");
      try {
        const response = await fetch(
          "http://localhost:5050/api/v1/transactions/my-donations",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const result = await response.json();
        if (response.ok) {
          setRecentDonations(result.data);
        } else {
          toast.error(result.message || "Could not fetch donations.");
        }
      } catch (error) {
        console.error("Failed to fetch donations:", error);
      }
    };

    fetchMyDonations();
  }, []);

  useEffect(() => {
    const fetchMonthlyDonations = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        const res = await fetch(
          "http://localhost:5050/api/v1/transactions/temple-donated-amount",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setMonthlyDonationStats(data.data?.totalMonthlyMATIC || 0);
      } catch (error) {
        console.error("Failed to fetch monthly donations:", error);
      }
    };

    fetchMonthlyDonations();
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  // Mock data
  const donationStats = {
    totalDonated: 150000,
    templeCount: 12,
    monthlyDonation: 25000,
    impactScore: 95,
  };
  const handleChangePassword = () => {
    alert("Change password functionality");
  };

  const impactReports = [
    {
      temple: "Tirumala Venkateswara Temple",
      project: "Free Meal Distribution",
      funded: 85,
      beneficiaries: 1500,
      status: "active",
    },
    {
      temple: "Meenakshi Amman Temple",
      project: "Temple Renovation",
      funded: 100,
      beneficiaries: 5000,
      status: "completed",
    },
  ];

  type MenuItemProps = {
    icon: React.ComponentType<{ size: number }>;
    label: string;
    id: string;
    active: boolean;
    onClick: (id: string) => void;
  };

  const MenuItem = ({
    icon: Icon,
    label,
    id,
    active,
    onClick,
  }: MenuItemProps) => (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
        active
          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
          : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  type StatCardProps = {
    icon: React.ComponentType<{ size: number; className?: string }>;
    title: string;
    value: string | number;
    change?: number;
    color?: string;
  };
  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    color = "orange",
  }: StatCardProps) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center`}
        >
          <Icon className="text-white" size={24} />
        </div>
        {change && (
          <span
            className={`text-sm font-semibold ${
              change > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 rounded-2xl text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {userData?.name || "Devotee"}! 🙏
        </h1>
        <p className="text-orange-100 text-lg">
          Your spiritual journey continues with transparent donations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={IndianRupee}
          title="Total Donated"
          value={
            userTotalDonations !== null && monthlyDonationStats !== undefined
              ? `${userTotalDonations.toLocaleString()} MATIC (₹${(
                  userTotalDonations * maticToInr
                ).toLocaleString()})`
              : "Loading..."
          }
          change={12}
        />
        <StatCard
          icon={Home}
          title="Temples Supported"
          value={verifiedCount}
          change={5}
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          title="This Month"
          value={
            monthlyDonationStats !== null && monthlyDonationStats !== undefined
              ? `${monthlyDonationStats.toLocaleString()} MATIC (₹${(
                  monthlyDonationStats * maticToInr
                ).toLocaleString()})`
              : "Loading..."
          }
          change={8}
          color="pink"
        />
        <StatCard
          icon={Award}
          title="Impact Score"
          value={`${donationStats.impactScore}/100`}
          change={3}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className="flex flex-col items-center cursor-pointer p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all"
            onClick={() => router.push("/user/donate")}
          >
            <Plus className="text-orange-600 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">
              New Donation
            </span>
          </button>
          <button className="flex flex-col items-center cursor-pointer p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-all">
            <Eye className="text-red-600 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">
              Track Funds
            </span>
          </button>
          <button className="flex flex-col items-center cursor-pointer p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-all">
            <Download className="text-pink-600 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">
              Tax Receipt
            </span>
          </button>
          <button className="flex flex-col items-center cursor-pointer p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-all">
            <Share2 className="text-yellow-600 mb-2" size={24} />
            <span className="text-sm font-medium text-gray-700">
              Share Impact
            </span>
          </button>
        </div>
      </div>

      {/* Recent Activity & Favorite Temples */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Recent Donations
          </h2>
          {recentDonations && recentDonations.length > 0 ? (
            <>
              <div className="space-y-4">
                {recentDonations.slice(0, 4).map(
                  (
                    donation: {
                      txHash: string;
                      _id: string;
                      receiver: any;
                      purpose: string;
                      amount: number;
                      status: string;
                    },
                    index
                  ) => (
                    <div
                      key={donation.txHash || donation._id || index}
                      className="p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        {/* Left side */}
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <Home className="text-white" size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {donation.receiver?.templeName || "Temple N/A"}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {donation.purpose}
                            </p>
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="text-right">
                          <p className="font-bold text-gray-800 text-sm">
                            {donation.amount} MATIC
                          </p>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              donation.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : donation.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {donation.status === "confirmed" ? (
                              <CheckCircle size={12} className="mr-1" />
                            ) : donation.status === "pending" ? (
                              <Clock size={12} className="mr-1" />
                            ) : (
                              <XCircle size={12} className="mr-1" />
                            )}
                            {donation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* View More */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setActiveTab("donations")}
                  className="text-sm font-medium text-orange-600 hover:text-orange-800 flex items-center focus:outline-none"
                >
                  View More <ArrowRight className="ml-1" size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600 p-6">
              <HandHeart className="mx-auto mb-2 text-orange-500" size={32} />
              <p className="text-sm">No donations have been made yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Impact Reports */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Impact Reports</h2>
        <div className="space-y-4">
          {impactReports.map((report, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {report.project}
                  </h3>
                  <p className="text-sm text-gray-600">{report.temple}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Funding Progress</span>
                  <span className="font-medium">{report.funded}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                    style={{ width: `${report.funded}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  <Users size={14} className="inline mr-1" />
                  {report.beneficiaries.toLocaleString()} beneficiaries
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDonations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Donations</h1>
        <div className="flex space-x-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search donations..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Donation History
          </h2>
        </div>

        {recentDonations && recentDonations.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {recentDonations.slice(0, 4).map(
              (
                donation: {
                  txHash: string;
                  _id: string;
                  receiver: any;
                  purpose: string;
                  amount: number;
                  status: string;
                  date: string;
                },
                index
              ) => (
                <div
                  key={donation.txHash || donation._id || index}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <Home className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {donation.receiver?.templeName || "Temple N/A"}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <MapPin size={14} className="mr-1" />
                          {donation.receiver?.templeLocation || "Location N/A"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Purpose: {donation.purpose}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">
                        {donation.amount} MATIC
                      </p>
                      <p className="text-sm text-gray-600">{donation.date}</p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          donation.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : donation.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {donation.status === "confirmed" ? (
                          <CheckCircle size={12} className="mr-1" />
                        ) : donation.status === "pending" ? (
                          <Clock size={12} className="mr-1" />
                        ) : (
                          <XCircle size={12} className="mr-1" />
                        )}
                        {donation.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Tx Hash: {donation.txHash.slice(0, 6)}...
                      {donation.txHash.slice(-4)}
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.oklink.com/amoy/tx/${donation.txHash}`,
                            "_blank"
                          )
                        }
                        className="text-orange-500 hover:text-orange-600 transition"
                        title="View on Amoy Explorer"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </p>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDonation(donation);
                          setShowDetailsModal(true);
                        }}
                        className="flex items-center text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-sm font-medium transition"
                      >
                        <Eye size={14} className="mr-1" /> View Details
                      </button>

                      <button className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm font-medium transition">
                        Download Receipt
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {showDetailsModal && selectedDonation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-xl relative">
                  <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    ✕
                  </button>
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Donation Details
                  </h2>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <strong>Temple Name:</strong>{" "}
                      {selectedDonation.receiver?.templeName || "N/A"}
                    </p>
                    <p>
                      <strong>Location:</strong>{" "}
                      {selectedDonation.receiver?.templeLocation || "N/A"}
                    </p>
                    <p>
                      <strong>Purpose:</strong> {selectedDonation.purpose}
                    </p>
                    <p>
                      <strong>Amount:</strong> {selectedDonation.amount} MATIC
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedDonation.date).toLocaleString() ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedDonation.status}
                    </p>
                    <p>
                      <strong>Transaction Hash:</strong>{" "}
                      {selectedDonation.txHash}
                    </p>
                    <p>
                      <strong>Sender Wallet: </strong>
                      {selectedDonation.sender?.walletAddress || "N/A"}
                    </p>
                    {/* Add more fields if needed */}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">
            <HandHeart className="mx-auto text-orange-500 mb-4" size={40} />
            <p className="text-lg font-medium">No donations found.</p>
            <p className="text-sm text-gray-400">
              You haven’t made any donations yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Analytics & Impact</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Donation Trends
          </h2>
          <div className="h-64 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would go here</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Temple Distribution
          </h2>
          <div className="h-64 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Pie chart would go here</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Impact Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">2,500+</div>
            <div className="text-gray-600">Meals Provided</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">15</div>
            <div className="text-gray-600">Projects Funded</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">50K+</div>
            <div className="text-gray-600">Lives Touched</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AuthWrapper role="user">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-lg min-h-screen">
            <div className="p-6 pt-2">
              <div
                className="flex items-center space-x-2 mb-8 cursor-pointer"
                onClick={() => router.push("/")}
              >
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

              <nav className="space-y-2">
                <MenuItem
                  icon={Home}
                  label="Dashboard"
                  id="dashboard"
                  active={activeTab === "dashboard"}
                  onClick={setActiveTab}
                />
                <MenuItem
                  icon={Heart}
                  label="My Donations"
                  id="donations"
                  active={activeTab === "donations"}
                  onClick={setActiveTab}
                />
                <MenuItem
                  icon={TrendingUp}
                  label="Analytics"
                  id="analytics"
                  active={activeTab === "analytics"}
                  onClick={setActiveTab}
                />
                <MenuItem
                  icon={History}
                  label="History"
                  id="history"
                  active={activeTab === "history"}
                  onClick={setActiveTab}
                />
                <MenuItem
                  icon={Settings}
                  label="Settings"
                  id="settings"
                  active={activeTab === "settings"}
                  onClick={setActiveTab}
                />
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">
                    {activeTab === "dashboard" && "Dashboard"}
                    {activeTab === "donations" && "My Donations"}
                    {activeTab === "analytics" && "Analytics"}
                    {activeTab === "history" && "History"}
                    {activeTab === "settings" && "Settings"}
                  </h1>
                </div>

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
                      <span>{`Connected: ${account.slice(
                        0,
                        6
                      )}...${account.slice(-4)}`}</span>
                    </motion.button>
                  )}
                  <button className="relative p-2 text-gray-600 hover:text-gray-800">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </button>
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
                            <p className="font-semibold text-gray-800">
                              {userData?.name || "Loading..."}
                            </p>
                            <p className="text-gray-600">
                              {userData?.email || "Loading..."}
                            </p>
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
                            logoutUrl="http://localhost:5050/api/v1/users/logout"
                            redirectTo="/"
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
            </header>

            {/* Content */}
            <main className="p-6">
              {activeTab === "dashboard" && renderDashboard()}
              {activeTab === "donations" && renderDonations()}
              {activeTab === "analytics" && renderAnalytics()}
              {(activeTab === "history" || activeTab === "settings") && (
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {activeTab === "history"
                      ? "Transaction History"
                      : "Settings"}
                  </h2>
                  <p className="text-gray-600">
                    This section is under development.
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
};

export default UserDashboard;
