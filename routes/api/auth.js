const express = require("express");
const router = express.Router();
const authmiddleware = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../../models/User");

//@router   GET /api/auth
//@desc     Test route
//@access   public
router.get(
  "/",
  authmiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(req.user.id).select("-password");
      res.json(user);
    } catch (err) {
      console.log(err.message);
      res.status(500).json("Server Error");
    }
  }

  //res.send("Auth route is working")
);

//@router   POST /api/auth
//@desc     Login User Route
//@access   public
router.post(
  "/",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      // check user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials " }] });
      }

      const comparePassword = await bcrypt.compare(password, user.password);

      if (!comparePassword) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials " }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      // return json webtoken
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          return res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      return res.status(500).send("Server Down");
    }
  }
);

module.exports = router;
