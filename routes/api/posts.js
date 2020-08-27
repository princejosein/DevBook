const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
const Profile = require("../../models/Profle");
const Post = require("../../models/Post");
const { route } = require("./users");

//@router   POST /api/posts
//@desc     Create post
//@access   private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
      });

      await newPost.save();

      return res.json(newPost);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

//@router   GET /api/posts
//@desc     Get all posts
//@access   public
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().select("-__v").sort({ date: -1 });
    return res.json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@router   GET /api/posts/user/:user_id
//@desc     Get all posts by a user
//@access   public
router.get("/user/:user_id", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.user_id });
    res.json(posts);
  } catch (err) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

//@router   GET /api/posts/:id
//@desc     Get Single Post
//@access   public
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post Not Found" });
    }
    return res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post Not Found" });
    }
    return res.status(500).send("Server Error");
  }
});

//@router   DELETE /api/posts/:post_id
//@desc     Delete Post by User
//@access   private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) return res.status(404).json({ msg: "Post Not Found" });

    //Check user
    if (post.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "Your Not Authorized to delete this post" });
    }

    await post.remove();

    return res.json({ msg: "Post Deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId")
      return res.status(404).json({ msg: "Post Not Found" });
    return res.status(500).send("Server Error");
  }
});

//@router   PUT /api/posts/like/:id
//@desc     Like a post
//@access   private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post Not Found" });

    //Check if post already have liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@router   PUT /api/posts/unlike/:id
//@desc     Unlike a post
//@access   private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post Not Found" });

    //Check if post already have liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post not liked yet" });
    }

    //Remove Index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@router   PUT /api/posts/comments/:id
//@desc     Create comment on post
//@access   private
router.put(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.id);

      const user = await User.findById(req.user.id).select("-password");

      const text = req.body.text;
      const comment = {
        text: text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
      };

      post.comments.unshift(comment);

      await post.save();

      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

//@router   DELETE /api/posts/comments/:id/:comment_id
//@desc     Delete a post comment
//@access   private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    //Check user
    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "User not authorized " });

    //Remove Index
    const removeIndex = post.comments
      .map((comment) => comment.id)
      .indexOf(comment.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
