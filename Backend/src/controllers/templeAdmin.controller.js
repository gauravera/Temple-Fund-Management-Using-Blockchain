import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { blacklistToken } from "../middlewares/auth.middleware.js";
import { templeAdminRegistrationEmail } from "../utils/emailTemplate.js";
import { storeWalletAddressUtility } from "../utils/storeWalletAddress.js";
import { io } from "../websocket.js"; // Import the WebSocket instance  
import crypto from "crypto";
import jwt from "jsonwebtoken";

// generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // storing refresh token into database 
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const storeWalletAddress = asyncHandler(async (req, res) => {
    const { walletAddress } = req.body;
    const userId = req.user._id;

    if (!walletAddress) {
        throw new ApiError(400, "Wallet address is required.");
    }

    const result = await storeWalletAddressUtility(userId, "templeAdmin", walletAddress);

    // Fetch the updated user from the database to ensure the wallet address is saved
    const updatedUser = await User.findById(userId);

    // Emit an event to notify all clients about the new confirmation
    io.emit("update-confirmations", {
        _id: updatedUser._id,
        templeName: updatedUser.templeName,
        templeLocation: updatedUser.templeLocation,
        email: updatedUser.email,
        phone: updatedUser.phone,
        name: updatedUser.name,
        walletAddress: updatedUser.walletAddress,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
    });

    res.status(200).json(
        new ApiResponse(
            200,
            { walletAddress: result.walletAddress },
            result.message
        ),
    );
});

// Controller: Register Temple Admin
const registerTempleAdmin = asyncHandler(async (req, res) => {
    const { name, email, phone, templeName, templeLocation } = req.body;

    // Ensure the user is a superAdmin
    if (!req.user || req.user.role !== "superAdmin") {
        throw new ApiError(403, "Access denied. Only superAdmin can register a Temple Admin.");
    }

    const superAdminId = req.user?._id; // assuming auth middleware sets this

    // Validate input
    if (!name || !email || !phone || !templeName || !templeLocation) {
        throw new ApiError(400, "All fields are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // Validate phone number length
    if (phone.length !== 10 || isNaN(phone)) {
        throw new ApiError(400, "Phone number must be 10 digits");
    }

    // Check if email or phone already exists
    const existingAdmin = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingAdmin) {
        throw new ApiError(409, "Temple Admin with this email or phone already exists");
    }

    // Generate random password (8 characters)
    const plainPassword = crypto.randomBytes(4).toString("hex"); // e.g., 'a1f9c2d3'

    // Generate the email message using the template
    const message = templeAdminRegistrationEmail(name, email, plainPassword);

    try {
        await sendEmail(email, "Your Temple Admin Account Credentials", message);
    } catch (error) {
        throw new ApiError(500, "Failed to send email. Please try again later.");
    }

    // Create and save TempleAdmin
    const newAdmin = new User({
        name,
        email,
        phone,
        password: plainPassword, // Will be hashed via pre-save middleware
        templeName,
        templeLocation,
        createdBy: superAdminId,
        role: "templeAdmin",
        loginType: "email",
        status: "pending",
        walletAddress: null, // Assuming wallet address is not required at registration
    });

    await newAdmin.save();

    if (!newAdmin) {
        throw new ApiError(500, "Something went wrong while creating the temple Admin");
    }
    // Remove sensitive data from response
    const createdTempleAdmin = await User.findById(newAdmin._id)

    if (!createdTempleAdmin) {
        throw new ApiError(500, "Something went wrong while registering the data")
    }

    return res
        .status(201).
        json(
            new ApiResponse(
                201,
                createdTempleAdmin,
                "Temple Admin registered successfully, credentials sent via email"
            )
        );
});

// Temple Admin Login Controller
const loginTempleAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new ApiError(400, "Both email and password are required.");
    }

    // Find the user with password field
    const existingTempleAdmin = await User.findOne({ email, role: "templeAdmin" }).select("+password");

    if (!existingTempleAdmin) {
        throw new ApiError(404, "Temple admin with this email does not exist.");
    }

    // Check if role is templeAdmin
    if (existingTempleAdmin.role !== "templeAdmin") {
        throw new ApiError(403, "Access denied. You are not a temple admin.");
    }

    // Match password
    const isPasswordValid = await existingTempleAdmin.comparePassword(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials.");
    }

    // generate access and refresh tokens 
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(existingTempleAdmin._id)

    // send access token and refresh token - cookie 
    const loggedInTempleAdmin = await User.findById(existingTempleAdmin._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None", // Important for production frontend + backend cross-origin
    }

    // Send success response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInTempleAdmin,
                    role: existingTempleAdmin.role,
                    accessToken,
                    refreshToken,
                },
                "Temple Admin logged in successfully."
            )
        );
});

// Temple Admin Logout Controller
const logoutTempleAdmin = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "You must be logged in to log out.");
    }

    // Validate the user's role
    if (req.user.role !== "templeAdmin") {
        throw new ApiError(403, "Access denied. Only temple admins can log out.");
    }

    // Add the access token to the blacklist
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
        blacklistToken(token);
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/",
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "Temple Admin Logged Out Successfully")
        )
});

const changeTempleAdminPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    // Validate input
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old password and new password are required.");
    }

    // Validate the strength of the new password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&:;</>])[A-Za-z\d@$!%#*?&;]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new ApiError(400, "New password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }

    const user = await User.findById(req.user?._id).select("+password")

    if (!user) {
        throw new ApiError(404, "User not Found")
    }

    // compare the provided old password with the stored hash 
    const isPasswordCorrect = await user.comparePassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect")
    }

    // Check if the new password same as the old password 
    const isSameAsOldPass = await user.comparePassword(newPassword)

    if (isSameAsOldPass) {
        throw new ApiError(400, "New Password can not be the same as the old Password!!")
    }

    // update the password 
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully"))
})

const refreshAccessTempleAdminToken = asyncHandler(async (req, res) => {

    // Take Incoming token from user 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    // validate incoming Token 
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unautorized request")
    }

    try {
        // Verify incoming token 
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        // decoded token me se userId (token) fetch karne ka 
        const user = await User.findById(decodedToken?._id).select("+refreshToken")

        // validate Fetch Userid (token)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        // check both token are match or not 
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict", // optional for extra security
            path: "/"
        }

        // if both tokens are match - generate new token
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        // return response 
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

// get current Temple Admin
const getCurrentTempleAdmin = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current User Fetched Successfully")
        )
})

// get all Temple Admins
const getAllTempleAdmins = asyncHandler(async (req, res) => {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, templeName, sortBy = "createdAt", order = "desc", fields } = req.query;

    // Validate sorting order
    const sortOrder = order === "asc" ? 1 : -1;

    // Build the query object
    const query = { role: "templeAdmin" };

    if (status) {
        query.status = status; // Filter by status
    }

    if (templeName) {
        query.templeName = { $regex: new RegExp(templeName, "i") }; // Case-insensitive search
    }

    try {
        // Count total documents matching the query
        const totalTempleAdmins = await User.countDocuments(query);

        // Fetch temple admins with pagination, sorting, and optional field selection
        const templeAdmins = await User.find(query)
            .sort({ [sortBy]: sortOrder }) // Dynamic sorting
            .skip(skip)
            .limit(limit)
            .select(fields ? fields.split(",").join(" ") : "-password -refreshToken") // Optional field selection
            .lean();

        if (!templeAdmins || templeAdmins.length === 0) {
            throw new ApiError(404, "No Temple Admins Found");
        }

        // Return response with pagination metadata
        return res.status(200).json(
            new ApiResponse(200, {
                templeAdmins,
                pagination: {
                    total: totalTempleAdmins,
                    page,
                    limit,
                    totalPages: Math.ceil(totalTempleAdmins / limit),
                    hasNextPage: page * limit < totalTempleAdmins,
                    hasPrevPage: page > 1,
                },
            }, "All Temple Admins fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching temple admins:", error);
        throw new ApiError(500, "Failed to fetch temple admins");
    }
});


const getActiveTempleAdmins = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
        const skip = (page - 1) * limit; // Calculate documents to skip

        const activeTempleAdmins = await User.find({ role: "templeAdmin", status: "active" })
            .select("name email phone templeName templeLocation status")
            .skip(skip) // Skip documents for pagination
            .limit(limit) // Limit the number of documents
            .lean();

        const total = await User.countDocuments({ role: "templeAdmin", status: "active" }); // Total count of active temple admins

        return res.status(200).json(
            new ApiResponse(200, { data: activeTempleAdmins, total, page, limit }, "Active temple admins fetched successfully.")
        );
    } catch (error) {
        console.error("Error fetching active temple admins:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch active temple admins.",
        });
    }
});

const forDonationActiveTemple = asyncHandler(async (req, res) => {
    try {
        const activeTempleAdmins = await User.find({ role: "templeAdmin", status: "active" })
            .select("templeName walletAddress")
            .lean();

        return res.status(200).json(
            new ApiResponse(200, { data: activeTempleAdmins }, "Active temple admins fetched successfully.")
        );
    } catch (error) {
        console.error("Error fetching active temple admins:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch active temple admins.",
        });
    }
});

export {
    storeWalletAddress,
    registerTempleAdmin,
    loginTempleAdmin,
    logoutTempleAdmin,
    changeTempleAdminPassword,
    refreshAccessTempleAdminToken,
    getCurrentTempleAdmin,
    getAllTempleAdmins,
    getActiveTempleAdmins,
    forDonationActiveTemple

}