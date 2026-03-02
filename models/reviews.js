const { string, number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewsSchema = new Schema({
    comment: { type: String },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    authorName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

});

module.exports = mongoose.model("Review", reviewsSchema);