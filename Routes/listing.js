const express = require("express");
const router = express.Router();
const wrapAsyc = require("../utils/wrapAsyc.js");
const ExpressError = require("../ExpressError.js");
const Listing = require("../models/listing.js");
const { listingSchema } = require("../schema.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const geocodePlace = require("../utils/geocode.js");


const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map(el => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

//Index Route
router.get("/", wrapAsyc(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));


//New Route
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

//Create Route
router.post(
    "/",
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsyc(async (req, res) => {

        if (!req.body.listing) {
            throw new ExpressError(400, "Send valid data for listing");
        }

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;

        // If image uploaded
        if (req.file) {
            console.log(req.file);
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        const place = req.body.listing.location;          //geocode for coodinates

        const coords = await geocodePlace(place);

        if (!coords) {
            req.flash("error", "Location not found");
            return res.redirect("/listings/new");
        }

        newListing.geometry = {
            type: "Point",
            coordinates: [coords.lon, coords.lat],
        };

        await newListing.save();
        req.flash("success", "New Listing Created");
        res.redirect("/listings");
    })
);


//Show Route
router.get("/:id", wrapAsyc(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "authorName",
                model: "User"
            }
        });
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}));


//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsyc(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    let originalImage = listing.image.url;
    originalImage = originalImage.replace("/upload", "/upload/w_250,h_250,c_fill/");
    res.render("listings/edit.ejs", { listing, originalImage });
}));

// Update Route
router.put(
    "/:id",
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsyc(async (req, res) => {

        let { id } = req.params;

        // 1️⃣ Get updated location
        const place = req.body.listing.location;

        // 2️⃣ Convert location → coordinates
        const coords = await geocodePlace(place);

        if (!coords) {
            req.flash("error", "Invalid location entered");
            return res.redirect(`/listings/${id}/edit`);
        }

        // 3️⃣ Update listing fields
        let listing = await Listing.findByIdAndUpdate(
            id,
            { ...req.body.listing },
            { new: true, runValidators: true }
        );

        // 4️⃣ Update geometry
        listing.geometry = {
            type: "Point",
            coordinates: [coords.lon, coords.lat],
        };

        // 5️⃣ Update image if new image uploaded
        if (typeof req.file !== "undefined") {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = { url, filename };
        }

        // 6️⃣ SAVE everything
        await listing.save();

        req.flash("success", "Listing updated");
        res.redirect(`/listings/${id}`);
    }));


//Delete Route
router.delete("/:id", isOwner, wrapAsyc(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("error", "Listing deleted");
    res.redirect("/listings");
}));

module.exports = router;