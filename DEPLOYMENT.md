# Deploying Smart Swap to Render

## Prerequisites
- A [Render account](https://render.com)
- Your code pushed to GitHub
- All environment variables ready

## Deployment Steps

### Method 1: Using Blueprint (render.yaml)

1. **Push the render.yaml file to your repository:**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create a new Blueprint on Render:**
   - Go to https://dashboard.render.com/blueprints
   - Click "New Blueprint Instance"
   - Connect your GitHub repository
   - Select the repository: `Swap_Station`
   - Render will detect the `render.yaml` file automatically

3. **Configure Environment Variables:**
   
   **Backend Service:**
   ```
   GROQ_API_KEY=<your-groq-api-key>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_KEY=<your-supabase-anon-key>
   TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
   TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
   DEMO_DRIVER_PHONE=<demo-driver-phone-number>
   N8N_WEBHOOK_URL=<your-n8n-url>/webhook/notification-trigger
   N8N_MAINTENANCE_WEBHOOK=<your-n8n-url>/webhook/maintenance-ticket
   ```

   **Frontend Service:**
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_API_URL=<your-backend-url>
   ```
   
   > **Note:** Copy your actual credentials from your local `.env` files in `backend/.env` and `frontend/.env`

4. **Apply the Blueprint**
   - Click "Apply" to create both services

### Method 2: Manual Setup

#### Backend Service

1. **Create a new Web Service:**
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Name:** `swap-station-backend`
     - **Runtime:** Node
     - **Build Command:** `cd backend && npm install`
     - **Start Command:** `cd backend && npm start`
     - **Plan:** Free

2. **Add Environment Variables** (from above list)

#### Frontend Service

1. **Create another Web Service:**
   - Dashboard → New → Web Service
   - Same repository
   - Configure:
     - **Name:** `swap-station-frontend`
     - **Runtime:** Node
     - **Build Command:** `cd frontend && npm install && npm run build`
     - **Start Command:** `cd frontend && npm run preview -- --host 0.0.0.0 --port $PORT`
     - **Plan:** Free

2. **Add Environment Variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (use the backend service URL from step 1)

### Post-Deployment

1. **Update CORS in backend** to allow your frontend domain
2. **Update Supabase** URL allowed origins if needed
3. **Test the deployed application**

### Important Notes

- Free tier services sleep after 15 minutes of inactivity
- Backend URL format: `https://swap-station-backend.onrender.com`
- Frontend URL format: `https://swap-station-frontend.onrender.com`
- N8N webhooks need to be publicly accessible (deploy n8n separately or use cloud version)

### Troubleshooting

- Check logs in Render dashboard
- Ensure all environment variables are set
- Verify build and start commands are correct
- Check that VITE_API_URL points to the correct backend URL
