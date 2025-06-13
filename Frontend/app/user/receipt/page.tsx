"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Share2, CheckCircle2, Calendar, Clock, Copy, ExternalLink } from "lucide-react"
import confetti from "canvas-confetti"
import jsPDF from "jspdf"

export default function GlobalDonationSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = searchParams.get("amount") || "0"
  const purpose = searchParams.get("purpose") || "general"
  const templeId = searchParams.get("templeId") || ""
  const templeName = searchParams.get("templeName") || "Temple"
  const templeLocation = searchParams.get("templeLocation") || ""
  const redirectToDashboard = searchParams.get("redirect") === "dashboard"
  const [transactionId, setTransactionId] = useState("")
  const [showCopied, setShowCopied] = useState(false)
  const [countdown, setCountdown] = useState(redirectToDashboard ? 5 : 0)

  // Generate a random transaction ID on component mount
  useEffect(() => {
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase()
    setTransactionId(`TXN${randomId}`)

    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  // Handle dashboard redirect countdown
  useEffect(() => {
    if (redirectToDashboard && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (redirectToDashboard && countdown === 0) {
      router.push("/user/dashboard")
    }
  }, [redirectToDashboard, countdown, router])

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const copyTransactionId = () => {
    navigator.clipboard.writeText(transactionId)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  const formattedPurpose =
  purpose === "custom" ? decodeURIComponent(purpose) : purpose.charAt(0).toUpperCase() + purpose.slice(1)

  const downloadReceipt = () => {
    const doc = new jsPDF()

    // Set up the PDF
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("Donation Receipt", 20, 30)

    // Add a line
    doc.setLineWidth(0.5)
    doc.line(20, 35, 190, 35)

    // Receipt details
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)

    let yPosition = 50
    const lineHeight = 8

    // Temple Information
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text("Temple Information", 20, yPosition)
    yPosition += lineHeight + 2

    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    doc.text(`Temple Name: ${templeName}`, 20, yPosition)
    yPosition += lineHeight

    if (templeLocation) {
      doc.text(`Location: ${templeLocation}`, 20, yPosition)
      yPosition += lineHeight
    }

    yPosition += 5

    // Donation Details
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text("Donation Details", 20, yPosition)
    yPosition += lineHeight + 2

    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    doc.text(`Amount: ₹${amount}`, 20, yPosition)
    yPosition += lineHeight

    doc.text(`Purpose: ${formattedPurpose}`, 20, yPosition)
    yPosition += lineHeight

    doc.text(`Transaction ID: ${transactionId}`, 20, yPosition)
    yPosition += lineHeight

    doc.text(`Date: ${formattedDate}`, 20, yPosition)
    yPosition += lineHeight

    doc.text(`Time: ${formattedTime}`, 20, yPosition)
    yPosition += lineHeight

    doc.text("Status: Completed", 20, yPosition)
    yPosition += lineHeight + 10

    // Tax Information
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text("Tax Benefits", 20, yPosition)
    yPosition += lineHeight + 2

    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    const taxText = "Your donation is eligible for tax benefits under Section 80G."
    const splitTaxText = doc.splitTextToSize(taxText, 170)
    doc.text(splitTaxText, 20, yPosition)
    yPosition += lineHeight * splitTaxText.length + 5

    const receiptText = "A tax receipt will be emailed to you within 24 hours."
    const splitReceiptText = doc.splitTextToSize(receiptText, 170)
    doc.text(splitReceiptText, 20, yPosition)
    yPosition += lineHeight * splitReceiptText.length + 15

    // Footer
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text("This is a computer-generated receipt.", 20, yPosition)
    yPosition += lineHeight
    doc.text("Payment secured by Razorpay", 20, yPosition)

    // Add timestamp
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 20, yPosition + lineHeight)

    // Save the PDF
    doc.save(`donation-receipt-${transactionId}.pdf`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={templeId ? `/temples/${templeId}` : "/temples"}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {templeId ? "Back to Temple" : "Back to Temples"}
        </Link>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-700">Donation Successful!</h1>
          <p className="text-gray-600 mt-2">Thank you for your generous contribution to {templeName}</p>

          {redirectToDashboard && countdown > 0 && (
            <div className="mt-4 bg-blue-50 text-blue-700 px-4 py-2 rounded-md inline-block">
              Redirecting to your dashboard in {countdown} seconds...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md border border-gray-200">
            <div className="bg-white rounded-t-lg p-6 pb-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Donation Receipt</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadReceipt}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors">
                    <Share2 className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Temple</p>
                    <p className="font-medium">{templeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-lg">₹{amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Purpose</p>
                    <p className="font-medium">{formattedPurpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className="font-medium text-green-600 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <div className="flex items-center">
                      <p className="font-medium font-mono">{transactionId}</p>
                      <button
                        onClick={copyTransactionId}
                        className="ml-1 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded"
                      >
                        {showCopied ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span className="sr-only">Copy transaction ID</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        <p className="text-sm">{formattedDate}</p>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <p className="text-sm">{formattedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-2">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-600"
                      >
                        <path d="M21 2H3v16h5v4l4-4h5l4-4V2z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Tax Benefits</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your donation is eligible for tax benefits under Section 80G. A tax receipt will be emailed to
                        you within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-b-lg p-6 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 text-orange-600"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                Secured by Razorpay
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 mr-1">Verify on blockchain:</span>
                <Link
                  href={`/transparency/blockchain?txn=${transactionId}`}
                  className="text-orange-600 hover:text-orange-700 underline flex items-center"
                >
                  View <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-white rounded-t-lg p-6 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Temple Information</h2>
              </div>
              <div className="p-6">
                <div className="relative w-full h-[120px] rounded-lg overflow-hidden mb-3">
                  <Image src="/placeholder.svg?height=120&width=240" alt={templeName} fill className="object-cover" />
                </div>
                <h3 className="font-medium">{templeName}</h3>
                <p className="text-sm text-gray-500">{templeLocation}</p>

                <div className="border-t border-gray-200 my-3"></div>

                <div className="space-y-2">
                  {templeId && (
                    <Link
                      href={`/temples/${templeId}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Return to Temple
                    </Link>
                  )}
                  {templeId && (
                    <Link
                      href={`/temples/${templeId}/gratitude`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                    >
                      View Wall of Gratitude
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="bg-white rounded-t-lg p-6 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold">What's Next?</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">1</span>
                    </div>
                    <p className="text-sm">Check your email for the donation receipt</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">2</span>
                    </div>
                    <p className="text-sm">View your donation history in your dashboard</p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">3</span>
                    </div>
                    <p className="text-sm">Explore other temples that need support</p>
                  </div>
                </div>

                <Link
                  href="/temples"
                  className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors mt-4"
                >
                  Explore More Temples
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
