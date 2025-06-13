import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.model.js";

const donateToTemple = asyncHandler(async (req, res) => {
    const {
        amount,
        txHash,
        gasPrice,
        transactionFee,
        purpose,
        status,
        templeWalletAddress
    } = req.body;

    if (!amount || !txHash || !gasPrice || !transactionFee || !purpose || !status) {
        throw new ApiError(400, "All fields are required");
    }

    if (!templeWalletAddress) {
        throw new ApiError(400, "Temple wallet address is required.");
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
        throw new ApiError(400, "Invalid donation amount");
    }

    // ✅ Validate gasPrice & transactionFee
    if (isNaN(gasPrice) || isNaN(transactionFee)) {
        throw new ApiError(400, "Invalid gasPrice or transactionFee");
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "failed"];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    // Validate purpose
    if (typeof purpose !== "string" || purpose.trim() === "") {
        throw new ApiError(400, "Invalid purpose");
    }

    // Check if transaction with the same txHash already exists
    const existingTransaction = await Transaction.findOne({ txHash });
    if (existingTransaction) {
        throw new ApiError(400, "Transaction with this hash already exists");
    }

    // Check if the sender exists and is authenticated
    const sender = req.user;
    if (!sender || !sender._id) {
        throw new ApiError(401, "Unauthorized: Sender not authenticated");
    }

    const templeAdmin = await User.findOne({
        walletAddress: templeWalletAddress.toLowerCase(),
        role: "templeAdmin",
        status: "active",
    });

    if (!templeAdmin) {
        throw new ApiError(404, "Temple admin not found or inactive");
    }

    // ✅ Create transaction
    const transaction = await Transaction.create({
        transactionType: "transfer",
        sender: sender._id,
        receiver: templeAdmin._id,
        amount,
        txHash,
        gasPrice,
        transactionFee,
        status,
        purpose,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                transaction,
                "Donation recorded successfully"
            )
        );
});

const donationHistory = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            throw new ApiError(400, "userId is not found");
        }

        const donations = await Transaction.find({
            sender: userId,
            transactionType: "transfer"
        })
            .populate({
                path: "receiver",
                select: "templeName templeLocation",
            })
            .populate({
                path: "sender",
                select: "walletAddress",
            })
            .sort({ createdAt: -1 }); // optional: latest first

        return res
            .status(201)
            .json(new ApiResponse(
                201,
                donations,
                "data fetched successfully !"
            ));
    } catch (error) {
        console.error("Error fetching donations:", error);
    }
})

export {
    donateToTemple,
    donationHistory
}