const express = require("express");
const tasks = require("../models/Task.model");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/task", authMiddleware, async (req, res) => {
  const NewTask = new tasks({
    ...req.body,
    owner: req.User._id,
  });
  try {
    await NewTask.save();
    res.status(201).send(NewTask);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/tasks", authMiddleware, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sort) {
    const parts = req.query.sort.split(":");
    sort[parts[0]] = parts[1] === "dsec" ? -1 : 1;
  }
  try {
    await req.User.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.limit) * parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.User.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/task/:id", authMiddleware, async (req, res) => {
  const _id = req.params.id;
  try {
    const Task = await tasks.findOne({ _id, owner: req.User._id });
    if (!Task) {
      return res.status(404).send();
    }
    res.send(Task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/task/:id", authMiddleware, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isvalidOps = updates.every((update) => {
    return allowedUpdates.includes(update);
  });
  if (!isvalidOps) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  const _id = req.params.id;
  try {
    const Task = await tasks.findOne({ _id, owner: req.User._id });
    if (!Task) {
      return res.status(404).send();
    }

    updates.forEach((task) => {
      Task[task] = req.body[task];
    });

    await Task.save();
    res.send(Task);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/task/:id", authMiddleware, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await tasks.findOneAndDelete({ _id, owner: req.User._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).send({ error: "Invalid ID" });
    }
    res.status(500).send(error);
  }
});

module.exports = router;
