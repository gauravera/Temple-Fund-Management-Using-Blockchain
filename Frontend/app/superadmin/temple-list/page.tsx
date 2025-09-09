"use client";

import React, { useState, useEffect } from "react";
import AuthWrapper from "@/app/components/AuthWrapper";

type Temple = {
  name: string;
  email: string;
  phone: string;
  templeName: string;
  templeLocation: string;
  status: string;
};

export default function TempleList() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Number of temples per page
  const [total, setTotal] = useState(0); // Total number of temples

  useEffect(() => {
    const fetchActiveTempleAdmins = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        const response = await fetch(`http://localhost:5050/api/v1/templeAdmin/get-active-temple-admins?page=${page}&limit=${limit}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        console.log("Fetched active temples:", result);

        if (!response.ok) {
          console.error("Error fetching active temple admins:", result.message);
          setTemples([]); // Clear temples if there's an error
          setTotal(0); // Reset total count
          return;
        }

        setTemples(result.data.data); // Update state with fetched data
        console.log("Temples data:", result.data);
        setTotal(result.data.total); // Update total count of temples
      } catch (error) {
        console.error("Error fetching active temple admins:", error);
        setTemples([]); // Clear temples on error
        setTotal(0); // Reset total count
      }
    };

    fetchActiveTempleAdmins();
  }, [page, limit]); // Refetch data when page or limit changes

  // Calculate total pages
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  return (
    <AuthWrapper role="superAdmin">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">
          All Active Temples
        </h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Temple Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Temple Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {temples.length > 0 ? (
                  temples.map((temple, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{temple.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.templeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.templeLocation}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {temple.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-600">
                      No active temples found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${page === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${page === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
          >
            Next
          </button>
        </div>
      </div>
    </AuthWrapper>
  );
}