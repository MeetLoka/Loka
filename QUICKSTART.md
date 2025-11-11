# 🚀 Quick Start Guide - Meet Loka

## Get Started in 3 Steps

### Step 1: Set Up Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Places API**
   - **Distance Matrix API**
   - **Geocoding API** (optional)
4. Create API credentials (API Key)
5. Copy your API key

### Step 2: Configure Backend

```bash
# Navigate to backend
cd backend

# Open .env file and add your Google API key
# Replace 'your_google_api_key_here' with your actual key
nano .env

# Or use this command (Mac/Linux):
echo "GOOGLE_API_KEY=YOUR_ACTUAL_KEY_HERE
PORT=3001" > .env
```

### Step 3: Start Both Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

You should see:

```
Server running on port 3001
Health check: http://localhost:3001/api/health
```

**Terminal 2 - Frontend:**

```bash
# From project root
npm run dev
```

You should see:

```
VITE v7.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
```

## 🎉 That's It!

Open http://localhost:5173/ in your browser and start creating trips!

## ✅ Quick Test

1. Click "Create New Trip" or navigate to trip wizard
2. Enter basic trip info
3. Add flight (skip if needed)
4. **Test Hotel Search:**

   - Type "Kempinski Dubai"
   - See autocomplete suggestions
   - Select a hotel
   - View details with rating and distance

5. **Test Ride:**

   - Click "Add Ride"
   - Select pickup: "Dubai International Airport"
   - Select dropoff: Your hotel
   - See distance and duration automatically calculate

6. **Test Attractions:**
   - Click "Add Attraction"
   - Search "Burj Khalifa" or "Dubai Mall"
   - See ratings, opening hours, reviews
   - Add to trip

## 🐛 Troubleshooting

**Backend won't start?**

- Check that port 3001 is not in use
- Verify .env file exists in backend/ folder
- Confirm Google API key is correct

**No search results?**

- Verify Google API key is set in backend/.env
- Check that Places API is enabled in Google Cloud Console
- Look at backend terminal for error messages

**Frontend errors?**

- Ensure backend is running first
- Check browser console (F12) for error messages
- Verify backend URL is correct (http://localhost:3001)

**Google API errors?**

- Enable billing in Google Cloud Console (required for Distance Matrix)
- Check API quotas haven't been exceeded
- Verify all required APIs are enabled

## 📚 Need More Help?

Check these files:

- `SETUP.md` - Detailed setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Complete feature list and technical details
- `README.md` - Project overview

## 🎯 Next Steps After Testing

Once everything works:

1. Add more trips
2. Implement trip details view
3. Add database persistence
4. Deploy to production
5. Add user authentication

---

**Happy Trip Planning!** ✈️🏨🚗🎡
