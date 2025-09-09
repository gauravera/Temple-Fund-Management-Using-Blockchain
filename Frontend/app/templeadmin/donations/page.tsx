"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Search, Calendar, Filter, Download, ExternalLink } from "lucide-react"
import AuthWrapper from "@/app/components/AuthWrapper"

type Donation = {
  _id: string;
  sender?: {
    name?: string;
  };
  amount: number;
  createdAt: string;
  purpose?: string;
  txHash: string;
  status: string;
};

export default function Donations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(donations.length / itemsPerPage);
  const currentDonations = donations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };


  useEffect(() => {
    const fetchTempleDonations = async () => {
      try {
        const accessToken = sessionStorage.getItem("accessToken");

        const res = await fetch("http://localhost:5050/api/v1/transactions/temple-donations", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });

        const result = await res.json();
        setDonations(result.data); 

      } catch (error) {
        console.error("Error fetching temple donations:", error);
      }
    };

    fetchTempleDonations();
  }, []);

  return (
    <AuthWrapper role="templeAdmin">
      <div className="p-8 space-y-6 h-full overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Donations</h1>
            <p className="text-gray-600 mt-2">Track and manage all donations received by the temple</p>
          </div>
        </motion.div>

        {/* Donation Tracker Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-2">Donation Tracker</h2>
          <p className="text-gray-600 mb-6">Track and manage all donations received by the temple</p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search donations..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Pick a date</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Filter</span>
            </motion.button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-medium text-gray-600">ID</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Donor</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Payment Mode</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Blockchain Hash</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDonations.map((donation, index) => (
                  <motion.tr
                    key={donation._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-gray-800 font-mono text-sm">
                      DON-{index + 1}
                    </td>
                    <td className="py-4 px-4 text-gray-800 font-medium">
                      {donation?.sender?.name || "Anonymous"}
                    </td>
                    <td className="py-4 px-4 text-gray-800 font-bold">
                      {donation.amount.toLocaleString()} MATIC
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {donation.purpose || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-mono text-xs truncate max-w-[180px]">
                      {donation.txHash}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${donation.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : donation.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-orange-500 hover:text-orange-600 transition-colors"
                        onClick={() =>
                          window.open(`https://www.oklink.com/amoy/tx/${donation.txHash}`, "_blank")
                        }
                      >
                        <ExternalLink className="w-5 h-5" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>

            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx + 1}
                className={`px-3 py-2 rounded-lg ${currentPage === idx + 1
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </motion.div>
      </div>
    </AuthWrapper>
  )
}
