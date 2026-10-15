# Ayyappa Travel Fund 🙏

A simple, clean savings tracker to manage daily deposits toward a **₹15,000 Ayyappa Deeksha pilgrimage travel fund**.

## Features

- 🎯 Track progress toward the ₹15,000 target.
- 💰 Record daily deposits from Rapido earnings.
- 📊 View total deposited, remaining amount, and completion percentage.
- 📝 View deposit history and delete incorrect entries.
- 🔐 Sign in securely using Google Authentication.
- ☁️ Store deposit records in Firebase Cloud Firestore.
- 🔄 Sync shared deposits in real time across users and devices.
- 📱 Responsive design for desktop and mobile devices.

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES Modules)
- Firebase Authentication
- Cloud Firestore
- Google Authentication
- Netlify
- Git and GitHub

## Getting Started

1. Clone this repository:

   ```bash
   git clone https://github.com/saimanoharhm/ayyappa_travel_fund_website.git
   ```

2. Open the project folder:

   ```bash
   cd ayyappa_travel_fund_website
   ```

3. Open the project in VS Code.

4. Configure Firebase in `script.js` using your Firebase project's web app configuration.

5. Enable Google Authentication in the Firebase Console.

6. Create a Cloud Firestore database and configure the security rules to allow only approved Google accounts to access the shared deposits.

7. Run the website using VS Code Live Server or deploy it through Netlify.

**Note:** The Firebase configuration must match your project, and your local or deployed website domain must be authorized in Firebase Authentication.

## Project Structure

```text
ayyappa_travel_fund_website/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a web app and copy its configuration into `script.js`.
3. Enable Google as a sign-in provider under Authentication.
4. Create a Cloud Firestore database.
5. Configure Firestore security rules to restrict access to approved users.
6. Add your local development domain and Netlify domain under Authorized domains.

## Deployment

This project can be deployed using Netlify.

1. Push your project files to GitHub.
2. Sign in to Netlify and import your GitHub repository.
3. Deploy the website.
4. Add your Netlify domain to Firebase Authentication's Authorized domains.
5. Test Google sign-in and verify that deposits sync across devices.

## Future Improvements

- 📈 Weekly and monthly savings reports.
- 📅 Deposit summaries by date.
- 📤 Export deposit history to CSV.
- 🎯 Support for multiple savings goals.

## License

This project is open for personal and educational use.
