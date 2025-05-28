# Simple Image CDN Server with WebP Conversion and Domain-Restricted CRUD

This project is a lightweight Node.js Express server designed to act as a simple Content Delivery Network (CDN) for images. It automatically converts uploaded images to the WebP format for optimization and allows CRUD (Create, Read, Update, Delete) operations to be restricted to specific, whitelisted domains.

## Features

- **Image Upload**: Accepts image uploads (JPEG, PNG, GIF, WebP).
- **Automatic WebP Conversion**: Converts uploaded images to WebP format to reduce file size while maintaining quality.
- **Static Image Serving**: Serves processed images efficiently.
- **Domain-Restricted CRUD**: Allows only specified domains to upload (Create) and delete (Delete) images. Image reading (Read) is public.
- **Unique Filenames**: Generates unique filenames for uploaded images to prevent conflicts.
- **Configurable**: Easy to configure allowed domains, image quality, and port.
- **Basic Error Handling**: Includes basic error handling for uploads and deletions.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or later recommended)
- [npm](https://www.npmjs.com/) (Node Package Manager, usually comes with Node.js)

## Setup and Installation

1.  **Clone the repository (or download the files):**

    ```bash
    # If you have it in a Git repository
    git clone [https://github.com/muhammadkusuma/simple-cdn-server.git](https://github.com/muhammadkusuma/simple-cdn-server.git)
    cd your-repo-name

    # If you downloaded the files, navigate to the project directory
    cd path/to/simple-cdn-server
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Allowed Domains:**
    Open the `server.js` file and modify the `allowedDomainsForCRUD` array to include the domains from which you want to allow image uploads and deletions.

    ```javascript
    // server.js
    const allowedDomainsForCRUD = [
      "http://localhost:5500",
      "[https://your-frontend-domain.com](https://your-frontend-domain.com)",
    ]; // Add your frontend domains
    ```

    For local development, if your frontend is served on `http://localhost:xxxx`, add that URL.

4.  **Create Image Directory (if not auto-created):**
    The server attempts to create an `public/images` directory. If it fails due to permissions, create it manually:
    ```bash
    mkdir -p public/images
    ```

## Running the Server

To start the server, run the following command in the project's root directory:

```bash
node server.js
```
