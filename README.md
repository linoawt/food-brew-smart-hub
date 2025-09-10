# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/60b11ff2-e904-4d88-81b1-8511c3416af8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/60b11ff2-e904-4d88-81b1-8511c3416af8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/60b11ff2-e904-4d88-81b1-8511c3416af8) and click on Share -> Publish.

## Admin Access Credentials

To access the admin dashboard, you'll need to create an admin user account:

### Creating an Admin Account
1. Go to `/auth` and sign up with any email/password
2. After signup, you'll need to manually update your role to 'admin' in the Supabase dashboard
3. Navigate to: Authentication > Users > Find your user > Edit
4. Or use the SQL editor to run: `UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';`

### Test Admin Credentials
For testing purposes, you can create an admin account with:
- **Email**: admin@smartportal.com
- **Password**: Admin123!@#
- After signup, update the role to 'admin' as described above

### Access URLs
- **Admin Dashboard**: `/admin/dashboard`
- **Vendor Dashboard**: `/vendor/dashboard` 
- **Customer Dashboard**: `/customer/dashboard`
- **Admin Login**: `/admin/login`

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
