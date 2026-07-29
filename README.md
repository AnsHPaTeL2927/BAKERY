# Cakes by Tulsi — Website (Frontend)

A responsive React + Tailwind CSS frontend for the "Cakes by Tulsi" homemade bakery,
built to match the Raksha Bandhan advertisement aesthetic (cream, blush pink,
chocolate brown, rounded/scalloped shapes).

This is the **customer-facing frontend only**, running on mock data. The hidden
admin panel and Node/Express/MongoDB backend from the original spec are a
separate, much larger build — see "Next Steps" below.

## What's included

- Home, About, Menu, Custom Cake (request form), Festival Specials, Gallery
  (with lightbox), Contact, and Privacy Policy pages
- React Router navigation, mobile-friendly nav
- WhatsApp ordering wired throughout (floating button, product cards, forms,
  festival CTAs) — sends a pre-filled message to the number in
  `src/data/mockData.js`
- Custom Cake request form built with React Hook Form + validation
- Festival offer banner that only shows the one offer marked `active: true`
- Gallery filterable by category with a lightbox viewer
- SEO meta tags + Open Graph tags in `index.html`

## Data

All content (products, categories, gallery images, festival offers, reviews,
site settings) lives in `src/data/mockData.js`. The shapes mirror the planned
MongoDB collections from the original spec, so swapping mock data for real API
calls later should be a fairly direct replacement — mostly changing where
each page/component gets its data from (import vs. fetch/axios call).

Update the WhatsApp number, phone, email, address, and social links in the
`siteConfig` object at the top of that file.

## Running locally

```bash
npm install
npm run dev       # starts a local dev server
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

## Next steps (not built in this pass)

The full original spec also called for:

- A hidden, non-obvious admin route with an access-key gate, bcrypt/JWT
  login, rate limiting, CAPTCHA, and login audit logs
- An admin dashboard with CRUD for products, gallery, festival offers,
  reviews, hero banner, about content, and site settings
- A Node.js/Express + MongoDB backend, with Cloudinary for image storage
  and Multer for uploads

None of that can run inside this environment (no live database, cloud
storage account, or persistent server here), but it's a natural next phase:
deploy this frontend, then build/deploy the backend separately (e.g. Render
or Railway for the API, MongoDB Atlas for the database, Cloudinary for
images) and connect this frontend to it.
"# BAKERY" 
