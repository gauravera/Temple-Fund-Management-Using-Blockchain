import { Router } from "express";
import {
    donateToTemple,
    createWithdrawal,
    donationHistory,
    getTransactionByTxHash,
    generateTempleReport,
    templeDonations,
    recentTempleDonations,
    recentDonations,
    templeMonthlyDonations,
    getTotalDonations,
    getUserTotalDonations,
    getUserMonthlyDonation
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();    

router.route("/donate-to-temple").post(verifyJWT, authorizeRoles("user"), donateToTemple);
router.route("/withdraw").post(verifyJWT, authorizeRoles("templeAdmin"), createWithdrawal);
router.route("/my-donations").get(verifyJWT, authorizeRoles("user"), donationHistory);
router.get("/receipt", verifyJWT, getTransactionByTxHash);
router.route("/generate-temple-report").get(verifyJWT, authorizeRoles("templeAdmin"), generateTempleReport);
router.route("/temple-donations").get(verifyJWT, authorizeRoles("templeAdmin"), templeDonations);
router.route("/recent-temple-donations").get(verifyJWT, authorizeRoles("templeAdmin"), recentTempleDonations);
router.route("/recent-donations").get(recentDonations);
router.route("/temple-monthly-donations").get(verifyJWT, authorizeRoles("templeAdmin"), templeMonthlyDonations);
router.route("/temple-total-donations").get(verifyJWT, authorizeRoles("templeAdmin"), getTotalDonations);
router.route("/total-donation-done").get(verifyJWT, authorizeRoles("user"), getUserTotalDonations);
router.route("/temple-donated-amount").get(verifyJWT, authorizeRoles("user"), getUserMonthlyDonation);

export default router
