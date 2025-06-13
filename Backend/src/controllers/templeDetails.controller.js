import { Temple } from "../models/templeDetails.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import slugify from "slugify";
import { io } from "../websocket.js";

function getPublicIdFromUrl(url) {
    const parts = url.split('/')
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId
}

// Create a new temple
const createTemple = asyncHandler(async (req, res) => {
    const {
        templeName,
        location,
        description,
        darshanTimings,
        specialCeremonies,
        activitiesAndServices,
        upcomingEvents,
        history,
        contactDetails,
        verificationRemarks,
    } = req.body;

     // Check if the user is a temple admin and their status is active
    if (!req.user || req.user.role !== "templeAdmin" || req.user.status !== "active") {
        throw new ApiError(403, "You are not authorized to create a temple. Please ensure your account is active and you should be a temple admin.");
    }

    // Validation: Check required fields
    if (!templeName || typeof templeName !== "string") {
        throw new ApiError(400, "Temple name must be provided and must be a string.");
    }

    if (!location || !location.city) {
        throw new ApiError(400, "Location and city must be provided.");
    }

    if (!description || !darshanTimings.morning || !darshanTimings.evening || !activitiesAndServices || !history || !contactDetails) {
        throw new ApiError(400, "All required fields must be provided.");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactDetails.email || !emailRegex.test(contactDetails.email)) {
        throw new ApiError(400, "A valid email address must be provided.");
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!contactDetails.phone || !phoneRegex.test(contactDetails.phone)) {
        throw new ApiError(400, "A valid 10-digit phone number must be provided.");
    }

    // Check if a temple with the same name and location already exists
    const existingTemple = await Temple.findOne({
        templeName,
        "location.city": location.city,
    });
    if (existingTemple) {
        throw new ApiError(409, "A temple with this name already exists in the specified city.");
    }

    // Check if the email or phone number already exists
    const existingContact = await Temple.findOne({
        $or: [
            { "contactDetails.email": contactDetails.email },
            { "contactDetails.phone": contactDetails.phone },
        ],
    });
    if (existingContact) {
        throw new ApiError(409, "A temple with this email or phone number already exists.");
    }

    // Parse special ceremonies and upcoming events
    const parsedSpecialCeremonies = specialCeremonies
        ? specialCeremonies.map((ceremony) => JSON.parse(ceremony))
        : [];
    const parsedUpcomingEvents = upcomingEvents
        ? upcomingEvents.map((event) => JSON.parse(event))
        : [];

    const slug = slugify(templeName, { lower: true });

    // const files = req.files || {};
    const coverImageFiles = req.files?.coverImage?.[0]?.path || "";
    if (!coverImageFiles) {
        throw new ApiError(400, "Please upload a cover image !!");
    }
    const coverImage = await uploadOnCloudinary(coverImageFiles);
    if (!coverImage) {
        throw new ApiError(400, "Please Upload cover image !!");
    }

    const photoGalleryFiles = req.files?.photoGallery?.map((file) => file.path) || [];
    // Upload the photo gallery images to Cloudinary
    const photoGallery = await Promise.all(
        photoGalleryFiles.map(async (filePath) => {
            try {
                const image = await uploadOnCloudinary(filePath);
                return image.secure_url;
            } catch (error) {
                console.error("Error uploading photo gallery image:", error);
                return null;
            }
        })
    );
    const validPhotoGallery = photoGallery.filter((url) => url);

    let isVerified = false;
    let verifiedBy = null;

    if (req.user && req.user.role === "templeAdmin") {
        isVerified = true;
        verifiedBy = req.user._id;
    }

    const newTemple = await Temple.create({
        templeName,
        slug,
        location,
        description,
        darshanTimings,
        specialCeremonies: parsedSpecialCeremonies,
        activitiesAndServices,
        upcomingEvents: parsedUpcomingEvents,
        history,
        contactDetails,
        coverImage: coverImage.secure_url,
        photoGallery: validPhotoGallery,
        registeredBy: req.user._id,
        verifiedBy,
        isVerified,
        verificationRemarks: isVerified ? verificationRemarks || "Verified by admin" : "",
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newTemple,
                "Temple Created Successfully !!"
            )
        );
});

// Update temple details
const updateTempleDetails = asyncHandler(async (req, res) => {
    const { templeId } = req.params;
    const {
        templeName,
        description,
        history,
        location,
        darshanTimings,
        activitiesAndServices,
        contactDetails,
        isVerified,
        verificationRemarks,
    } = req.body;

    const updatedFields = {};

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    // Fetch the temple
    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    // Update basic fields if provided
    if (templeName) {
        temple.templeName = templeName;
        updatedFields.templeName = templeName;
    }
    if (description) {
        temple.description = description;
        updatedFields.description = description;
    }
    if (history) {
        temple.history = history;
        updatedFields.history = history;
    }

    // Update location if provided
    if (location) {
        temple.location.address = location.address || temple.location.address;
        temple.location.city = location.city || temple.location.city;
        temple.location.state = location.state || temple.location.state;
        temple.location.country = location.country || temple.location.country;
        updatedFields.location = location;
    }

    // Update darshan timings
    if (darshanTimings) {
        temple.darshanTimings.morning = darshanTimings.morning || temple.darshanTimings.morning;
        temple.darshanTimings.evening = darshanTimings.evening || temple.darshanTimings.evening;
        updatedFields.darshanTimings = darshanTimings;
    }

    // Update activities and services
    if (activitiesAndServices) {
        temple.activitiesAndServices = activitiesAndServices;
        updatedFields.activitiesAndServices = activitiesAndServices;
    }

    // Update contact details
    if (contactDetails) {
        temple.contactDetails.phone = contactDetails.phone || temple.contactDetails.phone;
        temple.contactDetails.email = contactDetails.email || temple.contactDetails.email;
        temple.contactDetails.facebook = contactDetails.facebook || temple.contactDetails.facebook;
        temple.contactDetails.instagram = contactDetails.instagram || temple.contactDetails.instagram;
        temple.contactDetails.website = contactDetails.website || temple.contactDetails.website;
        updatedFields.contactDetails = contactDetails;
    }

    // Admin-only: Verification status
    if (req.user && req.user.role === "templeAdmin") {
        if (typeof isVerified === "boolean") {
            temple.isVerified = isVerified;
            updatedFields.isVerified = isVerified;
        }
        if (isVerified) {
            temple.verifiedBy = req.user._id;
            updatedFields.verifiedBy = req.user._id;
        }
        if (verificationRemarks) {
            temple.verificationRemarks = verificationRemarks;
            updatedFields.verificationRemarks = verificationRemarks;
        }
    }

    // Regenerate slug if templeName or city changed
    if (templeName || (location && location.city)) {
        temple.slug = slugify(`${temple.templeName}-${temple.location.city}`, {
            lower: true,
            strict: true,
        });
        updatedFields.slug = temple.slug;
    }

    try {
        await temple.save();
    } catch (error) {
        console.error("Error updating temple details:", error);
        throw new ApiError(500, "Failed to update temple details");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedFields, "Temple details updated successfully")
    );
});

const getTempleByAdmin = asyncHandler(async (req, res) => {
    const adminId = req.user._id;

    const temple = await Temple.findOne({ registeredBy: adminId })
    
    if (!temple) {
        throw new ApiError(400, "Temple not found for this admin");
    }

    return res.status(200).json(
        new ApiResponse(200, temple, "Temple fetched successfully")
    );
});

const getPublicTempleCards = asyncHandler(async (req, res) => {
    const temples = await Temple.find({ isVerified: true })
        .select("templeName location.city location.state description coverImage slug")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, temples, "Public temple cards fetched successfully")
    );
});


const getAllTemples = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { city, state, isVerified, sortBy = "createdAt", order = "desc", fields } = req.query;

    // Validate sorting order
    const sortOrder = order === "asc" ? 1 : -1;

    // Build the query object
    const query = {};

    if (city) {
        query["location.city"] = { $regex: new RegExp(city, "i") }; // case-insensitive
    }

    if (state) {
        query["location.state"] = { $regex: new RegExp(state, "i") }; // case-insensitive
    }

    if (isVerified !== undefined) {
        query.isVerified = isVerified === "true";
    }

    try {
        // Count total documents matching the query
        const totalTemples = await Temple.countDocuments(query);

        // Fetch temples with pagination, sorting, and optional field selection
        const temples = await Temple.find(query)
            .sort({ [sortBy]: sortOrder }) // dynamic sorting
            .skip(skip)
            .limit(limit)
            .select(fields ? fields.split(",").join(" ") : "-reviews") // optional field selection
            .lean();

        // Return response with pagination metadata
        return res.status(200).json(
            new ApiResponse(200, {
                temples,
                pagination: {
                    total: totalTemples,
                    page,
                    limit,
                    totalPages: Math.ceil(totalTemples / limit),
                    hasNextPage: page * limit < totalTemples,
                    hasPrevPage: page > 1,
                },
            }, "Temples fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching temples:", error);
        throw new ApiError(500, "Failed to fetch temples");
    }
});

const getTempleBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const temple = await Temple.findOne({ slug });

    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    return res.status(200).json(
        new ApiResponse(200, temple, "Temple fetched successfully")
    );
});


const updateTempleCoverImage = asyncHandler(async (req, res) => {
    const { templeId } = req.params;
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }
    // Find the temple by ID
    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    // Validate uploaded file
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please upload a new cover image");
    }

    // Upload new cover image to Cloudinary
    let uploadedImage;
    try {
        uploadedImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!uploadedImage || !uploadedImage.secure_url || !uploadedImage.public_id) {
            throw new ApiError(500, "Failed to upload cover image to Cloudinary");
        }
    } catch (error) {
        console.error("Error uploading cover image to Cloudinary:", error);
        throw new ApiError(500, "Failed to upload cover image to Cloudinary");
    }

    // Delete old cover image from Cloudinary if it exists
    if (temple.coverImage) {
        const publicId = getPublicIdFromUrl(temple.coverImage);
        try {
            await deleteFromCloudinary(publicId, "image");
        } catch (err) {
            console.warn("Failed to delete old cover image from Cloudinary:", err.message);
        }
    }

    // Update the new image in the database
    temple.coverImage = uploadedImage.secure_url;
    await temple.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { coverImage: temple.coverImage },
                "Temple cover image updated successfully"
            )
        );
});

const addGalleryImages = asyncHandler(async (req, res) => {
    const { templeId } = req.params;
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    const files = req.files;
    if (!files || files.length === 0) {
        throw new ApiError(400, "Please upload at least one gallery image");
    }

    // Upload all gallery images to Cloudinary
    const uploadedImages = await Promise.all(
        files.map(async (file) => {
            try {
                const result = await uploadOnCloudinary(file.path);
                return result?.secure_url;
            } catch (error) {
                console.error("Error uploading gallery image:", error.message);
                return null;
            }
        })
    );
    // Filter out failed uploads
    const validImages = uploadedImages.filter((url) => url);
    if (validImages.length === 0) {
        throw new ApiError(500, "Failed to upload any gallery images");
    }

    // Add new images to existing gallery
    temple.photoGallery.push(...validImages);
    await temple.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { addedImages: validImages },
                "Gallery images added successfully"
            )
        );
});

const deleteGalleryImage = asyncHandler(async (req, res) => {
    const { templeId } = req.params;
    const { imageUrl } = req.body;

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    // Validate imageUrl
    if (!imageUrl) {
        throw new ApiError(400, "Image URL is required");
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    // Check if image exists in the gallery
    const imageIndex = temple.photoGallery.indexOf(imageUrl);
    if (imageIndex === -1) {
        throw new ApiError(404, "Image not found in gallery");
    }

    // Extract public_id from imageUrl for Cloudinary deletion
    const publicIdMatch = imageUrl.match(/\/([^/]+)\.(jpg|jpeg|png|webp|gif|bmp|tiff|svg)$/i);
    if (!publicIdMatch) {
        throw new ApiError(400, "Invalid image URL format");
    }

    const publicId = publicIdMatch[1];
    try {
        await deleteFromCloudinary(publicId, "image");
    } catch (err) {
        console.warn("Failed to delete from Cloudinary. Continuing to remove from DB anyway.", err.message);
    }

    // Remove image from gallery array
    temple.photoGallery.splice(imageIndex, 1);
    await temple.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deletedImage: imageUrl },
                "Gallery image deleted successfully"
            )
        );
});

const addSpecialCeremony = asyncHandler(async (req, res) => {
    const { templeId } = req.params;
    const { name, dateTime } = req.body;

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    if (!name || !dateTime) {
        throw new ApiError(400, "Both name and dateTime of the ceremony are required");
    }

    // Validate dateTime
    if (isNaN(Date.parse(dateTime))) {
        throw new ApiError(400, "Invalid dateTime format");
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    temple.specialCeremonies.push({ name, dateTime });

    try {
        await temple.save();
    } catch (error) {
        console.error("Error saving special ceremony:", error);
        throw new ApiError(500, "Failed to add special ceremony");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                temple.specialCeremonies,
                "Special Ceremony added successfully"
            )
        );
});

const deleteSpecialCeremony = asyncHandler(async (req, res) => {
    const { templeId, ceremonyIndex } = req.params;

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    // Validate index
    const idx = parseInt(ceremonyIndex);
    if (isNaN(idx) || idx < 0) {
        throw new ApiError(400, "Invalid special ceremony index");
    }

    // Find the temple by ID
    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    // Check if the index is within bounds
    if (idx >= temple.specialCeremonies.length) {
        throw new ApiError(400, "Invalid special ceremony index");
    }

    // Extract the deleted ceremony
    const deletedCeremony = temple.specialCeremonies[idx];

    // Remove the special ceremony
    temple.specialCeremonies.splice(idx, 1);

    try {
        await temple.save();
    } catch (error) {
        console.error("Error deleting special ceremony:", error);
        throw new ApiError(500, "Failed to delete special ceremony");
    }

    return res.status(200).json(
        new ApiResponse(200, deletedCeremony, "Special ceremony deleted successfully")
    );
});

const addUpcomingEvent = asyncHandler(async (req, res) => {
    const { templeId } = req.params;
    const { title, description, eventDate } = req.body;

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    if (!title || !eventDate) {
        throw new ApiError(400, "Title and Event Date are required");
    }

    // Validate eventDate
    if (isNaN(Date.parse(eventDate))) {
        throw new ApiError(400, "Invalid Event Date format");
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    temple.upcomingEvents.push({ title, description, eventDate });

    try {
        await temple.save();
    } catch (error) {
        console.error("Error saving upcoming event:", error);
        throw new ApiError(500, "Failed to add upcoming event");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                temple.upcomingEvents,
                "Event added successfully"
            )
        );
});

const deleteUpcomingEvent = asyncHandler(async (req, res) => {
    const { templeId, eventIndex } = req.params;

    // Validate templeId
    if (!templeId || !/^[0-9a-fA-F]{24}$/.test(templeId)) {
        throw new ApiError(400, "Valid Temple ID is required");
    }

    const idx = parseInt(eventIndex, 10);
    if (isNaN(idx) || idx < 0) {
        throw new ApiError(400, "Invalid event index");
    }

    const temple = await Temple.findById(templeId);
    if (!temple) {
        throw new ApiError(404, "Temple not found");
    }

    // Check if the index is within bounds
    if (idx >= temple.upcomingEvents.length) {
        throw new ApiError(400, "Invalid event index");
    }

    // Extract the deleted event
    const deletedEvent = temple.upcomingEvents[idx];

    temple.upcomingEvents.splice(idx, 1);

    try {
        await temple.save();
    } catch (error) {
        console.error("Error deleting upcoming event:", error);
        throw new ApiError(500, "Failed to delete upcoming event");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            deletedEvent,
            "Event deleted successfully"
        )
    );
});

export {
    createTemple,
    updateTempleDetails,
    getTempleByAdmin,
    getPublicTempleCards,
    getAllTemples,
    getTempleBySlug,
    updateTempleCoverImage,
    addGalleryImages,
    deleteGalleryImage,
    addSpecialCeremony,
    deleteSpecialCeremony,
    addUpcomingEvent,
    deleteUpcomingEvent,
}
