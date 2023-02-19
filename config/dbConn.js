const moongose = require("mongoose");

const connectDB = async () => {
  try {
    await moongose.connect(process.env.MONGODB_URI, {});
    console.log("MongoDB Connected...");
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = connectDB;
