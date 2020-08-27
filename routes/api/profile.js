const express = require("express");
const router = express.Router();
const request = require("request");
const config = require("config");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profle");
const User = require("../../models/User");
const { route } = require("./users");
const { response } = require("express");

//@router   GET /api/profile/me
//@desc     Get current user profile
//@access   private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "No Profile for this user" });
    }

    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

//@router   POST /api/profile
//@desc     Create or Update user profile
//@access   private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      youtube,
      facebook,
      instagram,
      linkedin,
      twitter,
    } = req.body;

    //Build profile object {}
    const profileFields = {};

    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (twitter) profileFields.social.twitter = twitter;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //Update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      //Create profile
      profile = await new Profile(profileFields);
      profile.save();

      return res.json(profile);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server Error");
    }
  }
);

//@router   GET /api/profile
//@desc     Get all profiles
//@access   public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    return res.json(profiles);
  } catch (error) {
    console.error(error.message);
    return res.status(5000).send("Server Error");
  }
});

//@router   GET /api/profile/user/:user_id
//@desc     Get profile by user id
//@access   public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found" });
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId")
      return res.status(400).json({ msg: "Profile not found" });
    return res.status(500).send("Server Error");
  }
});

//@router   DELETE /api/profile
//@desc     Delete profile, posts and user
//@access   private
router.delete("/", auth, async (req, res) => {
  try {
    //Delete profile
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });

    return res.json({ msg: "User deleted" });
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId")
      return res.status(400).json({ msg: "Profile not found" });
    return res.status(500).send("Server Error");
  }
});

//@router   PUT /api/profile/experience
//@desc     Update experience
//@access   private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erros: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) return res.status(400).json({ msg: "Profile Not Found" });

      await profile.experience.unshift(newExp);

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

//@router   DELETE /api/profile/experience/:experience_id
//@desc     Delete experience from profile
//@access   private
router.delete("/experience/:experience_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: "Profile Not found" });

    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.experience_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

//@router   PUT /api/profile/education
//@desc     Update education
//@access   private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Field of study date is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erros: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) return res.status(400).json({ msg: "Profile Not Found" });

      await profile.education.unshift(newEducation);

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

//@router   DELETE /api/profile/education/:education_id
//@desc     Delete education from profile
//@access   private
router.delete("/education/:education_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: "Profile Not found" });

    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.education_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

//@router   GET /api/profile/github/:username
//@desc     Get User Github repository
//@access   public

router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=
    ${config.get("githubClientID")}&client_secret=${config.get("githubSecret")}
    }`,
      method: "GET",
      headers: {
        "user-agent": "node-js",
      },
    };
    request(options, (err, reqponse, body) => {
      if (err) console.error(err);
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "Github Profile not found" });
      }
      return res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
