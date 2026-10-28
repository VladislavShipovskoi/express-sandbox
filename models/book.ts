import { Schema, model, Types } from "mongoose";

export interface IBook {
  userId: Types.ObjectId;
  title?: string;
  description?: string;
  authors?: string;
  favorite?: string;
  fileCover?: string;
  fileName?: string;
  fileBook?: string;
}

const bookSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: String,
  description: String,
  authors: String,
  favorite: String,
  fileCover: String,
  fileName: String,
  fileBook: String,
});


module.exports = model<IBook>("Book", bookSchema);
