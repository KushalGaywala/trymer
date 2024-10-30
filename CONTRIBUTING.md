# Contributing to My React Timer Project

Thank you for your interest in contributing to the My React Timer Project! Contributions of all kinds are welcome, whether they are bug reports, feature requests, or pull requests. By working together, we can make this project better for everyone.

## Getting Started
- [Contributing to My React Timer Project](#contributing-to-my-react-timer-project)
  - [Getting Started](#getting-started)
  - [Contribution Guidelines](#contribution-guidelines)
    - [Branches](#branches)
    - [Pull Requests](#pull-requests)
    - [Code Style and Linting](#code-style-and-linting)
    - [Testing](#testing)
    - [Using Tailwind CSS for Styling](#using-tailwind-css-for-styling)
  - [Reporting Issues](#reporting-issues)
  - [Code of Conduct](#code-of-conduct)
  - [License](#license)

1. **Fork the Repository**: Start by forking the project repository to your own GitHub account.
2. **Clone the Repository**: Clone your forked repository to your local machine.

   ```bash
   git clone https://github.com/your-username/my-react-timer
   cd my-react-timer
   ```

3. **Install Dependencies**: Run the following command to install all project dependencies.

   ```bash
   pnpm install
   ```

4. **Run the Development Server**: Start the project with Vite’s development server.

   ```bash
   pnpm run dev
   ```

   You can view the app in your browser at [http://localhost:5173](http://localhost:5173).

## Contribution Guidelines

### Branches

- **Main Branch**: This branch contains the latest stable code, ready for release.
- **Feature Branches**: Create a branch for each feature using the naming convention `feat/your-feature-name`.
- **Bugfix Branches**: For any bug fixes, create a branch with the naming convention `fix/your-bug-name`.

### Pull Requests

When you’re ready to submit a pull request:

1. **Run Tests and Linting**: Ensure your code passes all tests and meets linting standards.
   
   ```bash
   pnpm run test # PS: Testing not impleted (A PR is always welcomed)
   pnpm run lint # PS: Lint works
   ```

2. **Commit Changes**: Commit your changes with a descriptive message.

3. **Submit a Pull Request**: Submit your pull request to the `main` branch. Include a summary of your changes and reference any related issues.

4. **Review Process**: Your pull request will be reviewed, and you may be asked to make updates. Once approved, it will be merged into the `main` branch.

### Code Style and Linting

This project uses **ESLint** for linting. Please ensure your code adheres to the linting guidelines by running:

```bash
pnpm run lint
```

### Testing

This project includes automated tests using **Jest** and **React Testing Library**. If you add new features or fix bugs, write tests to verify your code. To run tests, use:

```bash
pnpm run test
```

### Using Tailwind CSS for Styling

This project uses Tailwind CSS. Please follow the existing styling patterns by applying Tailwind’s utility classes in components. For global styling, refer to the `tailwind.config.js` and `src/index.css` files.

## Reporting Issues

If you find any bugs or have ideas for improvements, please open an issue. Include a detailed description, steps to reproduce (if applicable), and any other information that will help in understanding and fixing the issue.

## Code of Conduct

Please adhere to the [Code of Conduct](CODE_OF_CONDUCT.md) while contributing. Respectful and inclusive collaboration is expected of everyone.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

Thank you for contributing!