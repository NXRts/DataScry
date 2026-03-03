<div align="center">
  <h1>DataScry</h1>
  <p><strong>Your All-in-One Client-Side Toolkit for Files and Privacy</strong></p>
  
  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="TailwindCSS" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" /></a>
  </p>
</div>

---

## 🌟 Overview

**DataScry** (formerly PrivaKit) is a modern, fast, and feature-rich web application designed to help you manipulate files and protect your privacy securely. By leveraging modern web technologies, **all data processing happens directly in your browser**. 

No files are ever uploaded to a server, ensuring your data remains 100% private and secure.

## ✨ Features

DataScry offers a comprehensive suite of tools built into a seamless, unified interface:

- **🖼️ Image Compress**: Reduce image file sizes significantly without losing visible quality.
- **🗂️ Metadata Viewer**: Peek into the hidden EXIF data of your images and documents.
- **🛡️ Scrub EXIF data**: Strip all metadata from your files with a single click to protect your privacy before sharing.
- **📄 PDF to JPG**: Convert PDF documents into high-quality image files.
- **🖼️ JPG to PDF**: Quickly compile multiple images into a single, organized PDF document.
- **✂️ Split PDF**: Extract specific pages from a PDF.
- **🔗 Merge PDF**: Combine multiple PDF files into one.

## 🔒 Privacy First

We believe your data is yours alone. That's why DataScry is built with a strict **Privacy-First** architecture:
- **Zero Server Uploads**: Every tool runs locally on your device via client-side scripting.
- **Offline Capable**: Because it runs in the browser, you can use these tools even on a spotty connection once loaded.
- **Safe & Secure**: Open-source transparency means you can verify exactly what happens to your files.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Core Libraries**: 
  - `browser-image-compression` for images.
  - `pdf-lib` & `pdfjs-dist` for PDF manipulation.
  - `exifreader` for metadata extraction.
  - `jszip` & `idb` for browser storage and zipping.

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/NXRts/DataScry.git
cd DataScry
```

### 2. Install dependencies
```bash
npm install
# or yarn install / pnpm install / bun install
```

### 3. Run the development server
```bash
npm run dev
# or yarn dev / pnpm dev / bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app in action! 

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<p align="center">Made with ❤️ for Privacy and Efficiency.</p>
