const jwt = require("jsonwebtoken");
const express = require("express");
const user = require("../models/User.model");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  sendWelcomeEmail,
  sendCancellationEmail,
} = require("../emails/account");

//create user
router.post("/user", async (req, res) => {
  const Newuser = new user(req.body);

  try {
    const token = await Newuser.generateAuthToken();
    await Newuser.save();
    sendWelcomeEmail(Newuser.email, Newuser.name);
    res.status(201).send({ Newuser, token });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/users/profile", authMiddleware, async (req, res) => {
  res.send(req.User);
});

router.patch("/user/profile", authMiddleware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "age", "email", "password"];
  const isvalidOps = updates.every((update) => {
    return allowedUpdates.includes(update);
  });
  if (!isvalidOps) {
    return res.status(400).send({ error: "Invalid update" });
  }

  try {
    const User = req.User;
    updates.forEach((update) => {
      User[update] = req.body[update];
    });

    await User.save();
    res.send(User);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/user/profile", authMiddleware, async (req, res) => {
  try {
    await user.findOneAndDelete({ _id: req.User._id });
    res.send(req.User);
    sendCancellationEmail(req.User.email, req.User.name);
  } catch (error) {
    res.status(400).send();
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const User = await user.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await User.generateAuthToken();

    res.send({ User, token });
  } catch (error) {
    res.status(400).send({ error: "Invalid credentials" });
  }
});

router.post("/user/logout", authMiddleware, async (req, res) => {
  try {
    req.User.tokens = req.User.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.User.save();
    res.send();
  } catch (error) {
    res.status(500).send({ error: "error logging out" });
  }
});

router.post("/user/logoutAll", authMiddleware, async (req, res) => {
  try {
    req.User.tokens = [];

    await req.User.save();
    res.send();
  } catch (error) {
    res.status(500).send({ error: "error logging out" });
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("image not supported"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/user/profile/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    req.User.avatar = await sharp(req.file.buffer)
      .resize({ width: 200, height: 200 })
      .png()
      .toBuffer();
    await req.User.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({
      error: error.message,
    });
  }
);

router.delete("/user/profile/avatar", authMiddleware, async (req, res) => {
  req.User.avatar = undefined;
  await req.User.save();
  res.send();
});

router.get("/user/:id/avatar", async (req, res) => {
  try {
    const User = await user.findById(req.params.id);
    if (!User || !User.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/jpg");
    res.send(User.avatar);
  } catch (error) {
    res.status(400).send();
  }
});

module.exports = router;
