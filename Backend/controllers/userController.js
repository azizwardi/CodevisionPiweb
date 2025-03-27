const User = require("../models/User");

async function showuser(req, res) {
  try {
    const user = await User.find();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}
async function showByid(req, res) {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}
async function update(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

async function deleteuser(req, res) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send("deleted");
  } catch (err) {
    console.log(err);
  }
}
async function add(req, res) {
  try {
    console.log(req.body);
    const user = new User(req.body);
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  showuser,
  showByid,
  update,
  deleteuser,
  add,
};
