# Quick MongoDB Atlas Setup (Free)

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Start Free"
3. Create a free account (email/password)

## Step 2: Create a Cluster
1. After login, click "Create a Project"
2. Name it "Connex"
3. Click "Create Project"
4. Click "Create a Cluster"
5. Select "Free" tier (M0)
6. Choose region closest to you
7. Click "Create Cluster" (wait 3-5 min)

## Step 3: Set Database Access
1. Go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Username: `connex_user`
4. Password: `connex_password` (or create your own)
5. Database User Privileges: Select "Built-in Role" → "Atlas admin"
6. Click "Add User"

## Step 4: Get Connection String
1. Go to "Clusters" (left sidebar)
2. Click "Connect" button
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials

Example:
```
mongodb+srv://connex_user:connex_password@cluster0.mongodb.net/connex?retryWrites=true&w=majority
```

## Step 5: Update .env
1. Open `/Users/shubhamgupta/Desktop/connex/.env`
2. Paste the connection string in `MONGO_URI=`

## Step 6: Allow Network Access
1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

## Step 7: Start Backend
```bash
cd /Users/shubhamgupta/Desktop/connex/backend
npm install  # if not already done
npm run dev  # or: node server.js
```

## Step 8: Test Login
- Frontend: `npm start` in `/Users/shubhamgupta/Desktop/connex/frontend`
- Try login (it will auto-create test user if signup works)
