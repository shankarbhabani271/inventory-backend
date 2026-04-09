import UserDetails from "../models/userdetails.model.js";

// ✅ CREATE USER
export const createUserDetails = async (req, res) => {
  try {
    const user = new UserDetails(req.body);
    await user.save();

    res.status(201).json({
      message: "Saved successfully",
    });
  } catch (error) {
    console.log(error);

    // handle duplicate email/phone
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email or phone already exists",
      });
    }

    res.status(500).json({
      message: "Error saving user details",
    });
  }
};

// ✅ GET ALL USERS
export const getUserDetails = async (req, res) => {
  try {
    const users = await UserDetails.find().sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching users",
    });
  }
};