"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface TempleReportClientProps {
  templeId: string;
}

export default function TempleReportClient({
  templeId,
}: TempleReportClientProps) {
  const [reportType, setReportType] = useState("weekly");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  interface TempleInfo {
    templeName?: string;
    templeLocation?: string;
    _id?: string;
  }
  const [templeInfo, setTempleInfo] = useState<TempleInfo | null>(null);

  const fetchReport = async () => {
    setLoading(true);

    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const res = await fetch(
        `http://localhost:5050/api/v1/transactions/generate-temple-report?type=${reportType}&templeId=${templeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch report");
      }

      const result = await res.json();
      setReportData(result?.data?.report || []);
      setTempleInfo(result?.data?.templeInfo || null);
    } catch (error) {
      console.error("Error fetching donation report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (templeId) fetchReport();
    // eslint-disable-next-line
  }, [templeId, reportType]);

  const handleDownloadPDF = async () => {
    try {
      const reportElement = document.getElementById("report-content");
      if (!reportElement) return;

      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin: 0.5,
        filename: `${reportType}-temple-donation-report.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      // Wrap download in a Promise to wait for it to finish
      await html2pdf().set(opt).from(reportElement).save();

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF.");
      console.error("PDF generation error:", error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {/* Header + Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Donation
          Report
        </h2>
        <button
          onClick={handleDownloadPDF}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
        >
          Download PDF
        </button>
      </div>

      {/* Switch Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        {["weekly", "monthly"].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded font-medium ${
              reportType === type
                ? "bg-orange-600 text-white"
                : "bg-gray-200 text-black"
            }`}
            onClick={() => setReportType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Report only this section */}
      <div
        id="report-content"
        style={{
          padding: "30px",
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          color: "#222",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            padding: "10px 0",
            borderBottom: "2px solid #f57c00",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ fontSize: "24px", margin: "0", color: "#f57c00" }}>
            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Donation
            Report
          </h1>
        </div>

        {/* Temple Info Section */}
        <div
          style={{
            marginBottom: "20px",
            padding: "10px 20px",
            backgroundColor: "#fafafa",
            borderRadius: "6px",
            lineHeight: "1.6",
          }}
        >
          <p>
            <strong>Temple Name:</strong> {templeInfo?.templeName || "N/A"}
          </p>
          <p>
            <strong>Temple Location:</strong>{" "}
            {templeInfo?.templeLocation || "N/A"}
          </p>
          <p>
            <strong>Temple ID:</strong> {templeInfo?._id || "N/A"}
          </p>
          <p>
            <strong>Report Duration:</strong> Last{" "}
            {reportType === "weekly" ? "7" : "30"} Days
          </p>
          <p>
            <strong>Generated On:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
          }}
        >
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              {[
                "Date",
                "Amount (ETH)",
                "Status",
                "Purpose",
                "Transaction Hash",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((tx, index) => (
              <tr
                key={tx._id}
                style={{
                  backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                }}
              >
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {new Date(tx.createdAt).toLocaleDateString()}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {tx.amount}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textTransform: "capitalize",
                  }}
                >
                  {tx.status}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {tx.purpose}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    wordBreak: "break-word",
                  }}
                >
                  {tx.txHash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div
          style={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "14px",
            marginTop: "10px",
            lineHeight: "1.5",
          }}
        >
          <p>Total Transactions: {reportData.length}</p>
          <p>
            Total Amount Donated:{" "}
            {reportData.reduce((sum, tx) => sum + tx.amount, 0).toFixed(4)} ETH
          </p>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            marginTop: "40px",
            color: "#888",
            borderTop: "1px solid #eee",
            paddingTop: "10px",
          }}
        >
          This is a system-generated report from the Temple Fund Management
          System.
        </p>
      </div>
    </div>
  );
}
