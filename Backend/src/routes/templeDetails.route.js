import Router from 'express';
import { 
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
} from '../controllers/templeDetails.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// Route to create a new temple
router
    .route('/create-temple')
    .post(
        verifyJWT, 
        authorizeRoles('templeAdmin'), 
        upload.fields([
            { name: 'coverImage', maxCount: 1 },
            { name: 'photoGallery', maxCount: 10 },
        ]),
        createTemple);

// Route to update temple details
router.route('/update-temple/:templeId').post(verifyJWT, authorizeRoles('templeAdmin'), updateTempleDetails);

// Route to get temple by slug or ID
router.route('/get-temple-by-admin').get(verifyJWT, authorizeRoles('templeAdmin'), getTempleByAdmin);

// Route to get public temple cards
router.route('/public-temple-cards').get(getPublicTempleCards);


// Route to get all temples
router.route('/get-all-temples').get(getAllTemples);

router.route("/get-temple-by-slug/:slug").get(getTempleBySlug);


// Route to update temple cover image
router
    .route('/update-cover-image/:templeId')
    .put(
        verifyJWT, 
        authorizeRoles('templeAdmin'), 
        upload.single('coverImage'), 
        updateTempleCoverImage);

// Route to add gallery images
router
    .route('/add-gallery-images/:templeId')
    .put(
        verifyJWT, 
        authorizeRoles('templeAdmin'), 
        upload.array('photoGallery', 10), 
        addGalleryImages);

// Route to delete gallery image
router
    .route('/delete-gallery-image/:templeId')
    .delete(
        verifyJWT, 
        authorizeRoles('templeAdmin'), 
        deleteGalleryImage);

// Route to add special ceremonies
router.route('/add-special-ceremony/:templeId').post(verifyJWT, authorizeRoles('templeAdmin'), addSpecialCeremony);

// Route to delete special ceremony
router.route('/delete-special-ceremony/:templeId/:ceremonyIndex').delete(verifyJWT, authorizeRoles('templeAdmin'), deleteSpecialCeremony);

// Route to add upcoming events
router.route('/add-upcoming-event/:templeId').post(verifyJWT, authorizeRoles('templeAdmin'), addUpcomingEvent);

// Route to delete upcoming event
router.route('/delete-upcoming-event/:templeId/:eventIndex').delete(verifyJWT, authorizeRoles('templeAdmin'), deleteUpcomingEvent);

export default router;
