const express = require("express");
const router = express.Router();
// imports that exact Model, giving your routes the ability to actually find,
// modify, and delete your documents whenever a frontend request comes in
const Note = require("../models/Note");

// Get all notes
router.get("/", async (req, res) => {
  try {
    // tells Mongoose to reach into your MongoDB database
    // and request all the matching note documents.
    // Sorts it via newest notes first
    const notes = await Note.find().sort({ createdAt: -1 });
    // Packages data into a json format to send across to frontend
    // Assumes a 200 OK status
    res.json(notes);
  } catch (err) {
    // sends back a 500 Internal Server Error
    res.status(500).json({ error: err.message });
  }
});

// Get a specific note via id
router.get("/:id", async (req, res) => {
  try {
    // Remember to check for 404 manually
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post -> create a note
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.create({ title, content });
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT -> update a note
router.put("/:id", async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true, runValidators: true },
    );
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH -> partially update a note
router.patch("/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,          // pass the whole body, whatever fields are sent
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a note
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
