// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Shield,
  Users,
  TrendingUp,
  Zap,
  CheckCircle,
  Menu,
  X,
  ArrowRight,
  Star,
  Globe,
  Lock,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { templeService } from "./services/templeService";

interface ApiError {
  message: string;
  statusCode?: number;
}

export default function Home(){
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrollY > 50
            ? "bg-white/90 backdrop-blur-lg shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 mb-8 cursor-pointer" onClick={() => router.push("/")}>
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

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                How It Works
              </a>
              <a
                href="/temples"
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                Temples
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                Contact
              </a>
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white cursor-pointer px-6 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
              onClick={() => router.push("/login")}>
                Get Started
              </button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-lg z-40 md:hidden">
          <div className="flex flex-col items-center justify-center h-full space-y-8 text-lg">
            <a
              href="#features"
              className="text-gray-700 hover:text-orange-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-700 hover:text-orange-600"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#temples"
              className="text-gray-700 hover:text-orange-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Temples
            </a>
            <a
              href="#contact"
              className="text-gray-700 hover:text-orange-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            <button
              className="bg-gradient-to-r from-orange-500 to-red-500 cursor-pointer text-white px-8 py-3 rounded-full"
              onClick={() => router.push("/login")}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Revolutionizing
              </span>
              <br />
              Temple Fund Management
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Transparent, secure, and decentralized donation management system
              for Indian temples using blockchain technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 cursor-pointer rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center"
              onClick={() => router.push("/user/donate")}>
                Start Donating <ArrowRight className="ml-2" size={20} />
              </button>
              <button className="border-2 border-orange-500 text-orange-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-orange-50 transition-all">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="transform hover:scale-105 transition-all">
              <div className="text-4xl font-bold text-orange-600">
                {loading ? "..." : temples.length}+
              </div>
              <div className="text-gray-600 mt-2">Temples Connected</div>
            </div>
            <div className="transform hover:scale-105 transition-all">
              <div className="text-4xl font-bold text-red-600">₹50L+</div>
              <div className="text-gray-600 mt-2">Funds Managed</div>
            </div>
            <div className="transform hover:scale-105 transition-all">
              <div className="text-4xl font-bold text-pink-600">10K+</div>
              <div className="text-gray-600 mt-2">Active Donors</div>
            </div>
            <div className="transform hover:scale-105 transition-all">
              <div className="text-4xl font-bold text-orange-600">100%</div>
              <div className="text-gray-600 mt-2">Transparency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                Revolutionary Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on blockchain technology to ensure complete transparency and
              security in temple fund management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6">
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Complete Transparency
              </h3>
              <p className="text-gray-600">
                Every donation is recorded on the blockchain, ensuring complete
                transparency and accountability in fund usage.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                <Lock className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Secure Transactions
              </h3>
              <p className="text-gray-600">
                Advanced encryption and smart contracts ensure your donations
                reach the intended temple safely and securely.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
                <Eye className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Real-time Tracking
              </h3>
              <p className="text-gray-600">
                Track your donations in real-time and see exactly how funds are
                being utilized for temple development.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-6">
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Community Governance
              </h3>
              <p className="text-gray-600">
                Participate in temple decisions through decentralized governance
                and voting mechanisms.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Smart Analytics
              </h3>
              <p className="text-gray-600">
                Advanced analytics and reporting tools help temples optimize
                their fund management strategies.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mb-6">
                <Zap className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Instant Receipts
              </h3>
              <p className="text-gray-600">
                Get instant digital receipts and tax certificates for all your
                donations with blockchain verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 bg-gradient-to-r from-orange-100 to-red-100 px-6"
      >
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to start your transparent donation journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Connect Wallet</h3>
              <p className="text-gray-600">
                Connect your digital wallet to start making secure blockchain
                transactions
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Choose Temple</h3>
              <p className="text-gray-600">
                Browse and select from hundreds of verified temples across India
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Donate & Track</h3>
              <p className="text-gray-600">
                Make your donation and track its usage in real-time on the
                blockchain
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Temple Donations?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of devotees who trust Digital Seva for transparent
              and secure temple donations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-orange-600 px-8 py-4 rounded-full text-lg cursor-pointer font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
              onClick={() => router.push("/user/dashboard")}>
                Launch Dashboard
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🕉</span>
                </div>
                <span className="text-2xl font-bold">Digital Seva</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing temple fund management through blockchain
                technology and complete transparency.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-gray-400">
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-gray-400">
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </div>
                <div>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 Digital Seva. All rights reserved. Built with devotion
              for digital transparency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
