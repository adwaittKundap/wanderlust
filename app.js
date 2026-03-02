if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const listing = require("./Routes/listing.js");
const reviewRoutes = require("./Routes/review.js");
const user = require("./Routes/user.js");

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");


const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");

    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB connection error:", err);
  });


async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));



const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expire: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

/*const store = MongoStore.create({
  MONGO_URL: dbUrl,
});*/

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

/*app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "student07@gmail.com",
    username: "deltaa07-student",
  });
  let registedUser = await User.register(fakeUser, "H07elloworld");
  console.log(registedUser);
  res.send(registedUser);
});*/

app.use("/listings", listing);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/", user);


/*app.get("/testListing", async (req, res) => {
  let sampleListing = new Listing({
    title: "My New Villa",
    description: "By the beach",
    price: 1200,
    location: "Calangute, Goa",
    country: "India",
  })
  await sampleListing.save();
  console.log("sample was saved");
  res.send("successful testing");
});*/

/*app.all("*", (req, res, next) => {
  next(new ExpressError(404, "page not found"));
});*/

app.use((err, req, res, next) => {
  let { statuscode = 500, message = "something went wrong" } = err;
  res.status(statuscode).render("listings/Error.ejs", { message, err });
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});

