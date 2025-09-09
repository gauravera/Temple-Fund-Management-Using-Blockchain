"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"
import AuthWrapper from "@/app/components/AuthWrapper"


const recentExpenses = [
  { category: "Infrastructure", amount: "₹1,50,000", date: "17/5/2023" },
  { category: "Food & Prasad", amount: "₹25,000", date: "16/5/2023" },
  { category: "Salaries", amount: "₹75,000", date: "15/5/2023" },
  { category: "Events", amount: "₹50,000", date: "14/5/2023" },
  { category: "Utilities", amount: "₹15,000", date: "13/5/2023" },
]

type Donation = {
  donor: string;
  amount: string;
  date: string;
  purpose?: string;
};

export default function Dashboard() {
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  type MonthlyDonation = { month: string; amount: number };
  const [monthlyDonations, setMonthlyDonations] = useState<MonthlyDonation[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [totalDonationStats, setTotalDonationStats] = useState({ totalMATIC: 0 });
  const [maticToInr, setMaticToInr] = useState(0);
  const router = useRouter();

  const stats = [
    {
      title: "Total Donations",
      value: totalDonationStats?.totalMATIC
        ? `${totalDonationStats.totalMATIC.toLocaleString()} MATIC (₹${(totalDonationStats.totalMATIC * maticToInr).toLocaleString()})`
        : "Loading...",
      change: "+20.1% from last month",
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      trend: "up",
    },
    {
      title: "Total Expenses",
      value: "₹45,23,456",
      change: "+12.5% from last month",
      icon: TrendingDown,
      color: "from-red-500 to-pink-500",
      trend: "up",
    },
    {
      title: "Current Balance",
      value: "₹45,23,456",
      change: "+8.2% from last month",
      icon: Activity,
      color: "from-blue-500 to-cyan-500",
      trend: "up",
    },
    {
      title: "Active Users",
      value: userCount.toString(),
      change: "3 completed this month",
      icon: TrendingUp,
      color: "from-purple-500 to-violet-500",
      trend: "up",
    },
  ]


  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");

        const res = await fetch("http://localhost:5050/api/v1/transactions/recent-temple-donations", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await res.json();

        setRecentDonations(data.data || []);
      } catch (err) {
        console.error("Failed to load recent temple donations:", err);
      }
    };

    fetchRecent();
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        const res = await fetch("http://localhost:5050/api/v1/transactions/temple-monthly-donations", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const result = await res.json();
        setMonthlyDonations(result.data || []);
      } catch (err) {
        console.error("Error fetching donation trends", err);
      }
    };

    fetchTrends();
  }, []);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await fetch("http://localhost:5050/api/v1/superAdminDashboard/count-users");
        const result = await res.json();
        setUserCount(result.data.userCount || 0);
      } catch (error) {
        console.error("Failed to fetch user count:", error);
      }
    };

    fetchUserCount();
  }, []);

  useEffect(() => {
    const fetchTotalDonations = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        const res = await fetch("http://localhost:5050/api/v1/transactions/temple-total-donations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setTotalDonationStats(data.data);
      } catch (err) {
        console.error("Failed to fetch total donations:", err);
      }
    };

    fetchTotalDonations();
  }, []);

  useEffect(() => {
    const fetchMaticToINR = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=inr");
        const data = await res.json();
        setMaticToInr(data["matic-network"]?.inr || 0);
      } catch (error) {
        console.error("Error fetching MATIC to INR:", error);
        setMaticToInr(90); // fallback
      }
    };

    fetchMaticToINR();
  }, []);

  return (
    <AuthWrapper role="templeAdmin">
      <div className="p-8 space-y-8 h-full overflow-y-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, Temple Admin! Here's what's happening with your temple today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-600">{stat.title}</h3>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Trends */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">Donation Trends</h3>
            <p className="text-gray-600 mb-6">Monthly donation amounts for the current year</p>
            {/* Simple Bar Chart */}
            <div className="space-y-4">
              {monthlyDonations.map((item, index) => {
                const maxAmount = Math.max(...monthlyDonations.map(item => item.amount), 1);
                const matic = item.amount;
                const height = (matic / maxAmount) * 100;
                return (
                  <div key={item.month} className="flex items-center space-x-4">
                    <span className="w-8 text-sm text-gray-600">{item.month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${height}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm text-gray-600">{item.amount.toLocaleString()} MATIC</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Expense Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">Expense Distribution</h3>
            <p className="text-gray-600 mb-6">How temple funds are being utilized</p>

            {/* Pie Chart Representation */}
            <div className="space-y-3">
              {[
                { category: "Infrastructure", percentage: 40, color: "bg-orange-500" },
                { category: "Food & Prasad", percentage: 25, color: "bg-red-500" },
                { category: "Salaries", percentage: 15, color: "bg-yellow-500" },
                { category: "Events", percentage: 10, color: "bg-green-500" },
                { category: "Other", percentage: 10, color: "bg-blue-500" },
              ].map((item, index) => (
                <div key={item.category} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`} />
                  <span className="flex-1 text-sm text-gray-700">{item.category}</span>
                  <span className="text-sm font-medium text-gray-800">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col min-h-[350px]"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Donations</h3>
            <div className="space-y-4">
              {recentDonations.map((donation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{donation.donor}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-sm text-gray-600">{donation.date}</p>
                      <p className="text-xs text-gray-400">{donation.purpose || "General"}</p>
                    </div>

                  </div>
                  <span className="font-bold text-green-600">{donation.amount}</span>

                </motion.div>
              ))}
            </div>
            {/* Button */}
            <div className="mt-auto pt-4 text-right">
              <button
                onClick={() => router.push("/templeadmin/donations")}
                className="text-sm font-medium text-orange-600 hover:underline"
              >
                View All Donations →
              </button>
            </div>
          </motion.div>

          {/* Recent Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Expenses</h3>
            <div className="space-y-4">
              {recentExpenses.map((expense, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{expense.category}</p>
                    <p className="text-sm text-gray-600">{expense.date}</p>
                  </div>
                  <span className="font-bold text-red-600">{expense.amount}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AuthWrapper>
  )
}
