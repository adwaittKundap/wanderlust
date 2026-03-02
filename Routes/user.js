const express = require("express");
const wrapAsyc = require("../utils/wrapAsyc");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware");

router.get("/signup", async (req, res) => {
    res.render("users/signup.ejs");
});

router.post("/signup", wrapAsyc(async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registedUser = await User.register(newUser, password);
        console.log(registedUser);
        req.login(registedUser, (err) => {
            if (err) {
                next(err);
            }
            req.flash("success", "welcome to wanderlust");
            res.redirect("/listings");
        });

    }
    catch (error) {
        console.log(error);
        req.flash("error", "username exist");
        res.redirect("/signup");
    }
}));

router.get("/login", async (req, res) => {
    res.render("users/login.ejs");
})

router.post("/login", saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true, }), async (req, res) => {
    req.flash("success", "welcome back user ");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
});


router.get("/logout", (req, res) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }
        req.flash("success", "LoggedOut successfuly ");
        res.redirect("/listings");
    });
})
module.exports = router;