<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This repository contains the full Learning OS web application, ready for local execution and seamless deployment on **Vercel**.

## Deploy to Vercel

### Option 1: Deploy via Vercel Web Dashboard (Recommended)

1. Push this repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Vercel will automatically detect the settings from `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `USE_VERTEX_AI`: `true`
   - `VERTEX_PROJECT`: Your Google Cloud project ID.
   - `VERTEX_LOCATION`: A Vertex AI region with access to the selected model, such as `us-central1`.
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: the complete service-account JSON stored as a Vercel secret environment variable. Do not add the JSON key file to the repository or deployment bundle.
   - *(Optional)* `OPENALEX_API_KEY`: OpenAlex API key if you have one.
5. Click **Deploy**. Your app and serverless API endpoints will be live in under 1 minute!

For Vertex AI, the service account must have the Vertex AI User role and the Vertex AI API must be enabled in the project. Store credentials only in a secret environment variable or a local ignored file. Rotate the service-account key if it has ever been committed, uploaded, or otherwise exposed.

### Option 2: Deploy via Vercel CLI

1. Install the Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```
2. Log in to your Vercel account:
   ```bash
   vercel login
   ```
3. Deploy the project:
   ```bash
   vercel
   ```
4. Add your environment variables:
   ```bash
   vercel env add USE_VERTEX_AI production
   vercel env add VERTEX_PROJECT production
   vercel env add VERTEX_LOCATION production
   vercel env add GOOGLE_SERVICE_ACCOUNT_JSON production
   ```
   Repeat these commands with `preview` instead of `production` if you deploy preview environments.
5. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` and set the path to the service-account file and your Vertex project:
   ```env
   USE_VERTEX_AI=true
   VERTEX_PROJECT=your-google-cloud-project-id
   VERTEX_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json
   ```
3. Run the development server (runs full-stack Vite + Express on port 3000):
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Firebase Authentication and Firestore

The client uses Firebase Authentication and Cloud Firestore for account identity, learning sync, partner requests, and profile wall posts.

1. Create a Firebase project, add a Web App, and enable **Google** and **Anonymous** providers in Authentication.
2. Create a Cloud Firestore database in the same project.
3. Copy the Web App configuration into the Firebase variables in `.env.example`, then use those values in your ignored local `.env` file. These are public client settings; never put service-account credentials in `VITE_*` variables.
4. Set the same `VITE_FIREBASE_*` variables in the deployment environment. For Vercel, add them under **Project Settings → Environment Variables** and redeploy.
5. Install or run the Firebase CLI, select the project, and deploy the repository's Firestore rules:
   ```bash
   npx firebase-tools login
   npx firebase-tools use --add
   npx firebase-tools deploy --only firestore:rules
   ```

The CLI reads the rules path from `firebase.json`. Deploy rules only after selecting the intended Firebase project; the rules control access to all app data. Firebase Web App configuration identifies the project but does not grant database access by itself.
