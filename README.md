# HTML File Uploader

A Next.js application that allows users to upload static HTML files and preview them with independent `<html>` and `<head>` tags.

## Features

- Drag and drop file upload interface
- Support for HTML files only
- Preview uploaded HTML files in an iframe
- Unique file IDs for each upload
- Modern, responsive UI with Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app/page.tsx` - Main upload page
- `/src/app/preview/[id]/page.tsx` - Preview page for uploaded HTML
- `/src/app/api/upload/route.ts` - API endpoint for file uploads
- `/src/app/api/preview/[id]/route.ts` - API endpoint for retrieving uploaded files
- `/src/components/FileUploader.tsx` - File upload component
- `/src/lib/ensureUploadsDir.ts` - Utility for managing uploads directory

## Technologies Used

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- react-dropzone
- UUID

## Development

The application uses:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- Next.js App Router for routing
- API Routes for file handling

## Notes

- Uploaded files are stored in the `/uploads` directory
- Each file is given a unique UUID
- The preview page uses an iframe to display the HTML content
- The application validates that only HTML files are uploaded 