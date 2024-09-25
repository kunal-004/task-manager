const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tasks = require("./Task.model");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive integer");
        }
      },
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot include the word password");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Tasks",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.toJSON = function () {
  const User = this;

  const PublicUSerData = User.toObject();

  delete PublicUSerData.password;
  delete PublicUSerData.tokens;
  delete PublicUSerData.avatar;

  return PublicUSerData;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  return next();
});

userSchema.pre("findOneAndDelete", async function (next) {
  const user = await this.model.findOne(this.getQuery());
  if (user) {
    await tasks.deleteMany({ owner: user._id });
  }

  next();
});

userSchema.statics.findByCredentials = async (email, password) => {
  const User = await user.findOne({ email });
  if (!User) {
    throw new Error("unable to Login");
  }
  const isMatch = await bcrypt.compare(password, User?.password);
  if (!isMatch) {
    throw new Error("unable to Login");
  }
  return User;
};

userSchema.methods.generateAuthToken = async function () {
  const User = this;
  const token = jwt.sign(
    { _id: User._id.toString() },
    process.env.JWT_SECRET_KEY
  );
  User.tokens = User.tokens.concat({ token });
  await User.save();
  return token;
};

const user = mongoose.model("user", userSchema);

module.exports = user;
