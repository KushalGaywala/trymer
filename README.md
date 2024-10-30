# Trymer

This project is a React-based timer application built with **TypeScript** and **Vite**. It includes a modern development setup with **SWC** for fast compilation, **Tailwind CSS** for styling, and **Vitest** for testing.

## Table of Contents

- [Trymer](#trymer)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Build for Production](#build-for-production)
    - [Preview Production Build](#preview-production-build)
  - [Project Structure](#project-structure)
  - [Available Scripts](#available-scripts)
  - [Configuration](#configuration)
    - [ESLint](#eslint)
    - [Tailwind CSS](#tailwind-css)
    - [Vitest](#vitest)
  - [Contributing](#contributing)
  - [License](#license)

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- [**Node.js**](https://nodejs.org/en) (version 14 or later)
- [**pnpm**](https://pnpm.io/) (preferred package manager for this project)

To install pnpm if you don't already have it:

```bash
npm install -g pnpm # PS: Also visit pnpm site to install directly (linked previously)
```

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/KushalGaywala/trymer trymer
   cd trymer
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Run the Development Server**:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

### Build for Production

To create an optimized, production-ready build:

```bash
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
pnpm preview
```

---

## Project Structure

```plaintext
my-react-timer
├── public            # Static assets
├── src               # Source files
│   ├── components    # React components
│   ├── hooks         # Custom hooks
│   ├── styles        # Global styles (e.g., Tailwind CSS)
│   ├── App.tsx       # Main App component
│   ├── main.tsx      # Entry point
│   └── types         # TypeScript types
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite configuration
└── tailwind.config.js # Tailwind CSS configuration
```

---

## Available Scripts

- **`pnpm dev`**: Runs the development server.
- **`pnpm build`**: Builds the app for production.
- **`pnpm preview`**: Previews the production build.
- **`pnpm lint`**: Lints the codebase with ESLint.
- **`pnpm test`**: Runs the test suite with Vitest.

---

## Configuration

### ESLint

This project includes an ESLint configuration with type-aware lint rules. To lint your code, run:

```bash
pnpm lint
```

### Tailwind CSS

This project uses Tailwind CSS for styling. You can configure Tailwind settings in `tailwind.config.js`.

### Vitest

For testing, we use **Vitest** and **React Testing Library**. To run tests, use:

```bash
pnpm test
```

**PS: Testing and Tailwind are still needed to be integrated into the project. Although, PRs are always welcomed :)**

---

## Contributing

Contributions are welcome! Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to get started.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
