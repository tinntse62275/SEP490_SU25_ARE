import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Wrong password" });
    }

    user.isOnline = true;
    await user.save();
    // Generate JWT token
    const token = jwt.sign(

      { _id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,

      { expiresIn: "10d" }
    );

    // Send the response with the token and user details
    return res.status(200).json({

      success: true,
      token,
      user: { _id: user._id, name: user.name, role: user.role },
      isOnline: user.isOnline

    });

  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }

}

const verifynormal = async (req, res) => {
  try {
    // Lấy user từ middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, error: "Không tìm thấy người dùng!" });
    }

    return res.status(200).json({
      success: true,
      message: "Token hợp lệ!",
      user: { _id: user._id, name: user.name, role: user.role, email: user.email },
    });

  } catch (error) {
    console.error("❌ Lỗi xác minh token:", error);
    return res.status(500).json({ success: false, error: "Lỗi xác minh token!" });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Email already exists" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thiết lập role mặc định là 'customer'
    const userRole = "customer";

    // Tạo user mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      phone
    });

    // Lưu vào cơ sở dữ liệu
    await newUser.save();

    // Kiểm tra biến môi trường
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, error: "Missing JWT_SECRET in server configuration" });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Phản hồi thành công
    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
const googleAuth = async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Google token is required",
      })
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId })

    if (user) {
      // User exists with Google ID, just log them in
      user.isOnline = true
      await user.save()
    } else {
      // Check if user exists with this email (from regular registration)
      user = await User.findOne({ email })

      if (user) {
        // User exists with email, link Google account
        user.googleId = googleId
        user.picture = picture
        user.isOnline = true
        await user.save()
      } else {
        // Create new user with Google account
        // Generate a random password since it's required in your schema
        const randomPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(randomPassword, 10)

        user = new User({
          name,
          email,
          password: hashedPassword, // Required field, but won't be used for Google users
          googleId,
          picture,
          role: "customer",
          isOnline: true,
        })

        await user.save()
      }
    }

    // Generate JWT token (same format as your login function)
    const jwtToken = jwt.sign({ _id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    })

    // Send response in same format as your login function
    return res.status(200).json({
      success: true,
      token: jwtToken,
      user: { _id: user._id, name: user.name, role: user.role },
      isOnline: user.isOnline,
    })
  } catch (error) {
    console.error("Google Auth Error:", error.message)
    return res.status(500).json({ success: false, error: error.message })
  }
}


const googleCallback = async (req, res) => {
  try {
    const { code } = req.body

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.CLIENT_URL}/auth/google/callback`,
      }),
    })

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`)
    const googleUser = await userResponse.json()

    // Use your existing logic to create/find user
    let user = await User.findOne({ googleId: googleUser.id })

    if (!user) {
      user = await User.findOne({ email: googleUser.email })
      if (user) {
        user.googleId = googleUser.id
        await user.save()
      } else {
        const randomPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(randomPassword, 10)

        user = new User({
          name: googleUser.name,
          email: googleUser.email,
          password: hashedPassword,
          googleId: googleUser.id,
          role: "customer",
          isOnline: true,
        })
        await user.save()
      }
    }

    const jwtToken = jwt.sign({ _id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    })

    return res.status(200).json({
      success: true,
      token: jwtToken,
      user: { _id: user._id, name: user.name, role: user.role },
      isOnline: user.isOnline,
    })
  } catch (error) {
    console.error("Google callback error:", error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
export { login, register, verifynormal, googleAuth, googleCallback };

