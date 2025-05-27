"use client"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./register.css"

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!")
      return false
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters!")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email!")
      return false
    }
    if (!/^\d{10,}$/.test(formData.phone)) {
      toast.error("Please enter a valid phone number!")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.firstName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Registered successfully!")
        console.log("Server response:", data)
        setTimeout(() => {
          navigate("/login")
        }, 1500)
      } else {
        toast.error(`Error: ${data.error || "Registration failed"}`)
      }
    } catch (error) {
      console.error("Error registering:", error)
      toast.error("Something went wrong!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="container">
        <div className="left-panel">
          <div className="brand-content">
            <h1>OFFICIAL</h1>
            <p>Lorem Ipsum Dolor Sit Amet. Consectetur Adipiscing Elit.</p>
            <div className="decorative-line"></div>
          </div>
        </div>
        <div className="right-panel">
          <div className="form-container">
            <h2>Official Signup Form</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-row">
                <div className="input-group">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="mail@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="primary-btn">
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>

            <div className="login-link">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="highlight-link">
                  Login here
                </Link>
              </p>
            </div>

            <div className="additional-info">
              <div className="verification-notice">
                <p className="text-sm text-gray-400">📧 You'll receive a verification email after registration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
