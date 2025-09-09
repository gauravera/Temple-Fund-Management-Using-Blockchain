"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Save, Upload, Clock, Globe, Facebook, Instagram, Youtube, Twitter } from "lucide-react"
import AuthWrapper from "@/app/components/AuthWrapper"
import { toast } from "react-toastify"

export default function TempleInfo() {
  const hasFetched = useRef(false);
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdatingCoverImage, setIsUpdatingCoverIMage] = useState(false);
  const [templeData, setTempleData] = useState<{
    templeName: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
    };
    email: string;
    phone: string;
    description: string;
    history: string;
    coverImage: File | string | null;
    darshanTimings: {
      morning: string;
      evening: string;
    };
    contactDetails: {
      phone: string;
      email: string;
      facebook: string;
      instagram: string;
      website: string;
    };
    activitiesAndServices: string[];
    specialCeremonies: any[];
    upcomingEvents: any[];
    photoGallery: (File | string)[];
    _id?: string;
  }>({
    templeName: "", // Pre-filled from User model
    location: {
      address: "",
      city: "", // Pre-filled from User model
      state: "",
      country: "India",
    },
    email: "", // Pre-filled from User model
    phone: "", // Pre-filled from User model
    description: "",
    history: "",
    coverImage: null,
    darshanTimings: {
      morning: "",
      evening: "",
    },
    contactDetails: {
      phone: "",
      email: "",
      facebook: "",
      instagram: "",
      website: "",
    },
    activitiesAndServices: [],
    specialCeremonies: [],
    upcomingEvents: [],
    photoGallery: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (hasFetched.current) return
      hasFetched.current = true

      try {
        const accessToken = sessionStorage.getItem("accessToken");

        // Fetch temple admin details
        const adminResponse = await fetch(
          "http://localhost:5050/api/v1/templeAdmin/get-current-Temple-Admin",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const adminResult = await adminResponse.json();
        if (adminResponse.ok) {
          const { templeName, templeLocation, email, phone } = adminResult.data;
          setTempleData((prev) => ({
            ...prev,
            templeName,
            location: {
              ...prev.location,
              city: templeLocation,
            },
            email,
            phone,
          }));
        } else {
          console.error("Failed to fetch temple admin details:", adminResult.message);
        }

        // Fetch temple details
        const templeResponse = await fetch(
          "http://localhost:5050/api/v1/templeDetails/get-temple-by-admin",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const templeResult = await templeResponse.json();

        if (templeResponse.ok && templeResult.data) {
          const { email, phone, ...rest } = templeResult.data; // Exclude email and phone
          setTempleData((prev) => ({
            ...prev,
            ...rest,
            specialCeremonies: templeResult.data.specialCeremonies || [],
            upcomingEvents: templeResult.data.upcomingEvents || [],
          }));
        } else {
          console.warn("No temple data found for this admin.");
          toast.info("No temple found. Please create a new temple.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data.");
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      // Add basic fields
      formData.append("templeName", templeData.templeName);
      formData.append("location[address]", templeData.location.address);
      formData.append("location[city]", templeData.location.city);
      formData.append("location[state]", templeData.location.state);
      formData.append("location[country]", templeData.location.country);
      formData.append("description", templeData.description);
      formData.append("history", templeData.history);
      formData.append("darshanTimings[morning]", templeData.darshanTimings.morning);
      formData.append("darshanTimings[evening]", templeData.darshanTimings.evening);

      // Add activities and services
      if (templeData.activitiesAndServices.length > 0) {
        templeData.activitiesAndServices.forEach((activity) => {
          formData.append("activitiesAndServices[]", activity);
        });
      }

      // Add special ceremonies
      if (templeData.specialCeremonies.length > 0) {
        templeData.specialCeremonies.forEach((ceremony) => {
          formData.append("specialCeremonies[]", JSON.stringify(ceremony)); // Convert to JSON string
        });
      }

      // Add upcoming events
      if (templeData.upcomingEvents.length > 0) {
        templeData.upcomingEvents.forEach((event) => {
          formData.append("upcomingEvents[]", JSON.stringify(event)); // Convert to JSON string
        });
      }

      // Add contact details
      formData.append("contactDetails[email]", templeData.email); // Move email to contactDetails
      formData.append("contactDetails[phone]", templeData.phone); // Move phone to contactDetails
      formData.append("contactDetails[facebook]", templeData.contactDetails.facebook || "");
      formData.append("contactDetails[instagram]", templeData.contactDetails.instagram || "");
      formData.append("contactDetails[website]", templeData.contactDetails.website || "");

      // Add cover image
      if (templeData.coverImage) {
        formData.append("coverImage", templeData.coverImage);
      }

      // Add photo gallery images
      templeData.photoGallery.forEach((file, index) => {
        formData.append(`photoGallery`, file);
      });

      const accessToken = sessionStorage.getItem("accessToken");
      const response = await fetch(
        "http://localhost:5050/api/v1/templeDetails/create-temple",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast.success("Temple created successfully!");
        // Update the templeData state with the saved data from the backend
        setTempleData((prev) => ({
          ...prev,
          ...result.data,
          email: result.data.contactDetails.email,
          phone: result.data.contactDetails.phone,
        }));
      } else {
        console.error("Failed to create temple:", result.message);
        toast.error(`Failed to create temple: ${result.message}`);
      }
    } catch (error) {
      console.error("Error creating temple:", error);
      toast.error("An error occurred while creating the temple. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  interface FileUploadEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & EventTarget;
  }

  type FileUploadType = "coverImage" | "gallery";

  const handleFileUpload = (event: FileUploadEvent, type: FileUploadType) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (type === "coverImage") {
        setTempleData({ ...templeData, coverImage: file });
      } else if (type === "gallery") {
        setTempleData({
          ...templeData,
          photoGallery: [...templeData.photoGallery, file],
        });
      }
    }
  };

  const updateCoverImage = async () => {
    if (!templeData._id) {
      toast.error("Temple ID is not available.");
      return;
    }

    if (!templeData.coverImage || typeof templeData.coverImage !== "object") {
      toast.error("Please select a valid cover image to upload.");
      return;
    }

    setIsUpdatingCoverIMage(true);

    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("coverImage", templeData.coverImage); // Add the cover image file

      const response = await fetch(
        `http://localhost:5050/api/v1/templeDetails/update-cover-image/${templeData._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Cover image updated successfully!");
        // Update the state with the new cover image URL
        setTempleData((prev) => ({
          ...prev,
          coverImage: result.data.coverImage,
        }));
      } else {
        console.error("Failed to update cover image:", result.message);
        toast.error(`Failed to update cover image: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating cover image:", error);
      toast.error("An error occurred while updating the cover image.");
    } finally {
      setIsUpdatingCoverIMage(false);
    }
  };

  const uploadGalleryImages = async () => {
    if (!templeData._id) {
      toast.error("Temple ID is not available.");
      return;
    }

    if (templeData.photoGallery.length === 0) {
      toast.error("Please select at least one image to upload.");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const formData = new FormData();

      // Append all selected gallery images
      templeData.photoGallery.forEach((file) => {
        formData.append("photoGallery", file);
      });

      const response = await fetch(
        `http://localhost:5050/api/v1/templeDetails/add-gallery-images/${templeData._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Gallery images uploaded successfully!");
        // Update the state with the new gallery images
        setTempleData((prev) => ({
          ...prev,
          photoGallery: [
            ...prev.photoGallery.filter((img) => typeof img === "string"),
            ...result.data.addedImages,
          ],
        }));
      } else {
        console.error("Failed to upload gallery images:", result.message);
        toast.error(`Failed to upload gallery images: ${result.message}`);
      }
    } catch (error) {
      console.error("Error uploading gallery images:", error);
      toast.error("An error occurred while uploading gallery images.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  interface DeleteGalleryImageResponse {
    data?: {
      deletedImageUrl: string;
    };
    message?: string;
  }

  const deleteGalleryImage = async (imageUrl: string) => {
    if (!templeData._id) {
      toast.error("Temple ID is not available.");
      return;
    }
    try {
      const accessToken = sessionStorage.getItem("accessToken");

      const response = await fetch(
        `http://localhost:5050/api/v1/templeDetails/delete-gallery-image/${templeData._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ imageUrl }), // Pass the specific image URL
        }
      );

      const result: DeleteGalleryImageResponse = await response.json();

      if (response.ok) {
        toast.success("Image deleted successfully!");
        // Update the state to remove the deleted image from the gallery
        setTempleData((prev) => ({
          ...prev,
          photoGallery: prev.photoGallery.filter((image) => image !== imageUrl),
        }));
      } else {
        console.error("Failed to delete image:", result.message);
        toast.error(`Failed to delete image: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("An error occurred while deleting the image.");
    }
  };

  const renderGeneralTab = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        {/* Temple Name */}
        <label className="block text-sm font-medium text-gray-700 mb-2">Temple Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={templeData.templeName || ""}
          onChange={(e) =>
            setTempleData({
              ...templeData,
              templeName: e.target.value,
            })
          }
          disabled
          className="w-full px-4 py-3 border border-gray-200 rounded-xl  bg-gray-100 cursor-not-allowed"
        />
      </div>

      {/* Address Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={templeData.location.address || ""}
          onChange={(e) =>
            setTempleData({
              ...templeData,
              location: { ...templeData.location, address: e.target.value },
            })
          }
          placeholder="Enter the temple's address"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City<span className="text-red-500">*</span></label>
          <input
            type="text"
            value={templeData.location.city || ""}
            onChange={(e) =>
              setTempleData({
                ...templeData,
                templeName: e.target.value,
              })
            }
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State<span className="text-red-500">*</span></label>
          <input
            type="text"
            value={templeData.location.state || ""}
            onChange={(e) =>
              setTempleData({
                ...templeData,
                location: { ...templeData.location, state: e.target.value },
              })
            }
            placeholder="Enter the state"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
        <input
          type="text"
          value={templeData.location.country || ""}
          onChange={(e) =>
            setTempleData({
              ...templeData,
              location: { ...templeData.location, country: e.target.value },
            })
          }
          placeholder="Enter the country"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description<span className="text-red-500">*</span></label>
        <textarea
          rows={4}
          value={templeData.description || ""}
          onChange={(e) => setTempleData({ ...templeData, description: e.target.value })}
          placeholder="Describe your temple, its significance, and what makes it special..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      {/* History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Temple History<span className="text-red-500">*</span></label>
        <textarea
          rows={6}
          value={templeData.history || ""}
          onChange={(e) => setTempleData({ ...templeData, history: e.target.value })}
          placeholder="Share the history and significance of your temple..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>
    </motion.div >
  )

  const renderActivitiesAndServicesTab = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Activities and Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Activities and Services<span className="text-red-500">*</span></label>
        <textarea
          rows={4}
          value={templeData.activitiesAndServices.join(", ") || ""}
          onChange={(e) =>
            setTempleData({
              ...templeData,
              activitiesAndServices: e.target.value.split(",").map((item) => item.trim()),
            })
          }
          placeholder="Enter activities and services separated by commas (e.g., Meditation, Yoga, Prasad Distribution)"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Darshan Timings */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Darshan Timings</h3>
        <p className="text-gray-600 mb-6">Set the morning and evening darshan timings for your temple</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Morning Timings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Morning Timings<span className="text-red-500">*</span></label>
          <input
            type="text"
            value={templeData.darshanTimings.morning || ""}
            onChange={(e) =>
              setTempleData({
                ...templeData,
                darshanTimings: { ...templeData.darshanTimings, morning: e.target.value },
              })
            }
            placeholder="e.g., 6:00 AM - 12:00 PM"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Evening Timings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Evening Timings<span className="text-red-500">*</span></label>
          <input
            type="text"
            value={templeData.darshanTimings.evening || ""}
            onChange={(e) =>
              setTempleData({
                ...templeData,
                darshanTimings: { ...templeData.darshanTimings, evening: e.target.value },
              })
            }
            placeholder="e.g., 4:00 PM - 9:00 PM"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderSpecialCeremoniesTab = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Special Ceremonies */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Special Ceremonies</h3>
        <p className="text-gray-600 mb-6">Add details about special ceremonies conducted at your temple.</p>
        {templeData.specialCeremonies.map((ceremony, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center border-b border-gray-200 pb-4 mb-4">
            {/* Ceremony Name */}
            <div className="col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ceremony Name</label>
              <input
                type="text"
                value={ceremony.name || ""}
                onChange={(e) => {
                  const updatedCeremonies = [...templeData.specialCeremonies];
                  updatedCeremonies[index].name = e.target.value;
                  setTempleData({ ...templeData, specialCeremonies: updatedCeremonies });
                }}
                placeholder="Enter ceremony name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Ceremony Date and Time */}
            <div className="col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ceremony Date and Time</label>
              <input
                type="datetime-local"
                value={ceremony.dateTime ? ceremony.dateTime.replace("Z", "").slice(0, 16) : ""}
                onChange={(e) => {
                  const updatedCeremonies = [...templeData.specialCeremonies];
                  updatedCeremonies[index].dateTime = e.target.value;
                  setTempleData({ ...templeData, specialCeremonies: updatedCeremonies });
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Delete Button */}
            <div className="col-span-2 flex justify-center">
              <button
                onClick={() => {
                  const updatedCeremonies = templeData.specialCeremonies.filter((_, i) => i !== index);
                  setTempleData({ ...templeData, specialCeremonies: updatedCeremonies });
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            setTempleData({
              ...templeData,
              specialCeremonies: [...templeData.specialCeremonies, { name: "", dateTime: "" }],
            })
          }
          className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Add Ceremony
        </button>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Upcoming Events</h3>
        <p className="text-gray-600 mb-6">Add details about upcoming events at your temple.</p>
        {templeData.upcomingEvents.map((event, index) => (
          <div key={index} className="space-y-4 border-b border-gray-200 pb-4 mb-4">
            {/* Event Title and Date in One Row */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={event.title || ""}
                  onChange={(e) => {
                    const updatedEvents = [...templeData.upcomingEvents];
                    updatedEvents[index].title = e.target.value;
                    setTempleData({ ...templeData, upcomingEvents: updatedEvents });
                  }}
                  placeholder="Enter event title"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input
                  type="date"
                  value={event.eventDate ? event.eventDate.split("T")[0] : ""}
                  onChange={(e) => {
                    const updatedEvents = [...templeData.upcomingEvents];
                    updatedEvents[index].eventDate = e.target.value;
                    setTempleData({ ...templeData, upcomingEvents: updatedEvents });
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => {
                    const updatedEvents = templeData.upcomingEvents.filter((_, i) => i !== index);
                    setTempleData({ ...templeData, upcomingEvents: updatedEvents });
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
              <textarea
                rows={3}
                value={event.description}
                onChange={(e) => {
                  const updatedEvents = [...templeData.upcomingEvents];
                  updatedEvents[index].description = e.target.value;
                  setTempleData({ ...templeData, upcomingEvents: updatedEvents });
                }}
                placeholder="Enter event description"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            setTempleData({
              ...templeData,
              upcomingEvents: [...templeData.upcomingEvents, { title: "", description: "", eventDate: "" }],
            })
          }
          className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Add Event
        </button>
      </div>
    </motion.div>
  );

  const renderSocialMediaTab = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">Contact Information</h3>
      <p className="text-gray-600 mb-6">Provide contact details for your temple.</p>

      {/* Phone Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number<span className="text-red-500">*</span></label>
          <input
            type="tel"
            value={templeData.phone || ""}
            onChange={(e) =>
              setTempleData({
                ...templeData,
                phone: e.target.value,
              })
            }
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email<span className="text-red-500">*</span></label>
          <input
            type="email"
            value={templeData.email || ""}
            onChange={(e) =>
              setTempleData({
                ...templeData,
                email: e.target.value,
              })
            }
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>
      {/* Facebook */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
        <input
          type="url"
          value={templeData.contactDetails.facebook || ""}
          onChange={(e) =>
            setTempleData({
              ...templeData,
              contactDetails: { ...templeData.contactDetails, facebook: e.target.value },
            })
          }
          placeholder="Enter Facebook URL"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Instagram */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
        <input
          type="url"
          value={templeData.contactDetails.instagram || ""}
          onChange={(e) =>
            setTempleData({
              ...templeData,
              contactDetails: { ...templeData.contactDetails, instagram: e.target.value },
            })
          }
          placeholder="Enter Instagram URL"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Website */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
        <input
          type="url"
          value={templeData.contactDetails.website || ""}
          onChange={(e) =>
            setTempleData({
              ...templeData,
              contactDetails: { ...templeData.contactDetails, website: e.target.value },
            })
          }
          placeholder="Enter website URL"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
    </motion.div>
  );

  const renderCoverImageTab = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">Cover Image & Gallery</h3>
      <p className="text-gray-600 mb-6">
        Upload a cover image and manage your image gallery.
      </p>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
        <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center">
          {templeData.coverImage ? (
            <img
              src={typeof templeData.coverImage === "string"
                ? templeData.coverImage
                : URL.createObjectURL(templeData.coverImage)}
              alt="Cover Image"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No cover image uploaded</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-left gap-3">
          {/* Select Cover */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const input = document.getElementById("coverImageInput");
              if (input) input.click();
            }}
            className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Select Cover Image</span>
          </motion.button>
          <input
            type="file"
            id="coverImageInput"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileUpload(e, "coverImage")}
          />
          {/* Conditionally Render Update Cover Image Button */}
          {templeData._id && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={updateCoverImage}
              disabled={isUpdatingCoverImage}
              className={`mt-4 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2 ${isUpdatingCoverImage ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isUpdatingCoverImage ? (
                <span className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <span>Updating...</span>
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Update Cover Image</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Image Gallery</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templeData.photoGallery.map((image, index) => (
            <div key={index} className="space-y-4">
              <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center">
                {image ? (
                  <img
                    src={typeof image === "string" ? image : URL.createObjectURL(image)}
                    alt={`Gallery Image ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No image uploaded</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (typeof image === "string") {
                      deleteGalleryImage(image);
                    } else {
                      toast.error("Cannot delete unsaved image. Please upload first.");
                    }
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-left gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const input = document.getElementById("galleryImageInput");
              if (input) input.click();
            }}
            className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Select Images</span>
          </motion.button>
          <input
            type="file"
            id="galleryImageInput"
            style={{ display: "none" }}
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, "gallery")}
          />

          {/* Conditionally Render Upload Gallery Images Button */}
          {templeData._id && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={uploadGalleryImages}
              disabled={isLoading}
              className={`mt-4 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2 ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <span>Uploading...</span>
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Upload Images</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );

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
            <h1 className="text-3xl font-bold text-gray-800">Temple Information</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isLoading}
            className={`bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg flex items-center space-x-2 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-2"
        >
          {[
            { id: "general", label: "General" },
            { id: "activitiesAndServices", label: "Activities & Timings" },
            { id: "specialCeremonies", label: "Special Ceremonies & Events" },
            { id: "coverImage", label: "Cover Image & Gallery" },
            { id: "socialMedia", label: "Social Media" },

          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-orange-50 border border-gray-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          {activeTab === "general" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">General Information</h2>
              <p className="text-gray-600 mb-6">Update the basic information about your temple</p>
              {renderGeneralTab()}
            </>
          )}
          {activeTab === "activitiesAndServices" && renderActivitiesAndServicesTab()}
          {activeTab === "specialCeremonies" && renderSpecialCeremoniesTab()}
          {activeTab === "coverImage" && renderCoverImageTab()}
          {activeTab === "socialMedia" && renderSocialMediaTab()}
        </motion.div>
      </div>
    </AuthWrapper >
  )
}
