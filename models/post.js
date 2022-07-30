const { Schema , model} = require("mongoose");

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      required: true,
      type: String,
    },
    content: {
      required: true,
      type: String,
    },
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref:"User",
    },
  },
  { timestamps: true }
);


module.exports = model('Post',postSchema);