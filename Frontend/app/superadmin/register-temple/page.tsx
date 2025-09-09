"use client";

import React, { useState } from "react";
import { apiClient } from "@/app/utils/apiClient";
import { toast } from "react-toastify";
import AuthWrapper from "@/app/components/AuthWrapper";

const RegisterTemplePage = () => {

  const [form, setForm] = useState({
    templeName: "",
    authorityName: "",
    email: "",
    phone: "",
    location: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const token = sessionStorage.getItem("accessToken");

    try {
      const res = await apiClient(
        "http://localhost:5050/api/v1/templeAdmin/register-Temple-Admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.authorityName,
            email: form.email,
            phone: form.phone,
            templeName: form.templeName,
            templeLocation: form.location,
          }),
        },
        "superAdmin"
      );

      if (!res.ok) throw new Error("Failed to submit form");

      const data = await res.json();
      console.log("Success response:", data);
      toast.success("Temple registered successfully!");

      setForm({
        templeName: "",
        authorityName: "",
        email: "",
        phone: "",
        location: "",
      });
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWrapper role="superAdmin">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Register New Temple</h2>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temple Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Temple Name"
                  name="templeName"
                  value={form.templeName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter Temple Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Person Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Authority Person Name"
                  name="authorityName"
                  value={form.authorityName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter Email Address"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              {isLoading ? "Registering..." : "Register Temple"}
            </button>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
export default RegisterTemplePage;
