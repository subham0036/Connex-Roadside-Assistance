# 🚀 CONNEX Quick Start Guide - Login Fix

## Issue
Login was failing because MongoDB was not running/configured.

## Solution: Use MongoDB Atlas (Cloud - Free)

---

## ⚡ Step 1: Set Up MongoDB Atlas (5 minutes)

### 1.1 Create Account
- Go to: https://www.mongodb.com/cloud/atlas
- Click "Start Free"
- Sign up (email/password)

### 1.2 Create a Cluster
1. Click "Create a Project" → Name it `Connex`
2. Click "Create Project"
3. Click "Create a Cluster"
4. Select **Free** tier (M0 - always free)
5. Choose region closest to you
6. Click "Create Cluster" (wait 3-5 minutes)

### 1.3 Create Database User
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
   - Username: `connex_user`
   - Password: `connex_password` (you can change this)
   - Click "Add User"

### 1.4 Get Connection String
1. Go to **Clusters** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Copy the connection string (looks like):
```
mongodb+srv://connex_user:connex_password@cluster0.mongodb.net/connex?retryWrites=true&w=majority
```

### 1.5 Allow Network Access
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click "Confirm"

---

## ⚡ Step 2: Update .env File

File: `/Users/shubhamgupta/Desktop/connex/.env`

Replace with your MongoDB connection string:
```
MONGO_URI=mongodb+srv://connex_user:connex_password@cluster0.mongodb.net/connex?retryWrites=true&w=majority
JWT_SECRET=connex_super_secret_key_2024
PORT=5000
```

---

## ⚡ Step 3: Start Backend Server

Open Terminal and run:
```bash
cd /Users/shubhamgupta/Desktop/connex/backend
npm install
npm run dev
```

Expected output:
```
✓ Server running on http://localhost:5000
✓ MongoDB: Configured
✓ JWT Secret: Configured
```

---

## ⚡ Step 4: Start Frontend

Open **NEW Terminal** and run:
```bash
cd /Users/shubhamgupta/Desktop/connex/frontend
npm start
```

Frontend will open at: http://localhost:3000

---

## ⚡ Step 5: Test Login/Signup

### Try Signup First (recommended)
1. Click "Customer Signup"
2. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `test123456`
   - Phone: `9876543210`
   - Address: `New Delhi`
3. Click "Create account"
4. Should redirect to Customer Dashboard

### Then Login
1. Go back to Login page
2. Email: `test@example.com`
3. Password: `test123456`
4. Click "Sign in"

---

## ⚠️ Troubleshooting

### Error: "Login failed" or "Network Error"
- Check if backend is running: http://localhost:5000/api/health
- Check .env MONGO_URI is correct
- Check MongoDB Atlas network access is set to 0.0.0.0/0

### Error: "Email already used"
- Try a different email for signup
- Or login with an existing email you created

### Error: "MongoDB connection error"
- Check internet connection (MongoDB Atlas needs it)
- Check MONGO_URI in .env file
- Check username/password are correct in connection string
- Wait 5 minutes after creating MongoDB Atlas cluster

### Error: "Invalid token"
- Clear browser localStorage: Press F12 → Application → LocalStorage → Delete all
- Try login again

---

## 📝 Test Credentials (After Signup)

```
Email: test@example.com
Password: test123456
Role: Customer
```

Try different roles:
- **Customer:** Click "Customer Signup" → Navigate to `/customer`
- **Garage Owner:** Click "Garage Owner Signup" → Navigate to `/garage`
- **Admin/Staff:** Can only be created manually in database

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created and running
- [ ] Database user created (connex_user)
- [ ] Network access set to 0.0.0.0/0
- [ ] .env file updated with MongoDB URI
- [ ] Backend started (npm run dev) on port 5000
- [ ] Frontend started (npm start) on port 3000
- [ ] Can signup with new email
- [ ] Can login with same email
- [ ] Redirected to correct dashboard based on role

---

## 🎯 Next Steps

After login is working:
1. Test customer dashboard → Find nearby garages
2. Test garage owner dashboard → View requests
3. Test map functionality (Leaflet maps)
4. Test responsive design on mobile

---

## 📞 Need Help?

Check backend logs:
```bash
# See this in backend terminal:
✓ Server running on http://localhost:5000
```

Check frontend logs:
```bash
# Open browser console (F12) and check for errors
```

Check MongoDB connection:
Visit: http://localhost:5000/api/health
Should return: `{"status":"ok","service":"Connex backend"}`
