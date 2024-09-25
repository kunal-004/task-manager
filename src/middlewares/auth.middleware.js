const jwt = require("jsonwebtoken");
const user = require("../models/User.model");
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const User = await user.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    if (!User) {
      throw new Error();
    }
    req.token = token;
    req.User = User;
    next();
  } catch (error) {
    res.status(401).send({
      message: "Please authenticate",
    });
  }
};

module.exports = authMiddleware;
