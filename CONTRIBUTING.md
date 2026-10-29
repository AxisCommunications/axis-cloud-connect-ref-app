# Contributing

Contributions are welcome! Whether it's a bug report, feature request, or a pull request — all contributions are appreciated.

## Reporting issues

- **Bugs**: open a [bug report][issues_new] with steps to reproduce, expected vs. actual behavior, and your environment details.
- **Feature requests**: open an [issue][issues_new] describing the problem you'd like solved and your proposed solution.

Please search [existing issues][issues] before opening a new one.

## Contributing code

1. [Fork the repository](https://docs.github.com/github/getting-started-with-github/fork-a-repo)
2. Clone your fork and create a branch:

    ```sh
    git clone https://github.com/<your username>/axis-cloud-connect-ref-app.git
    cd axis-cloud-connect-ref-app
    git switch -c <branch name>
    ```

3. Install dependencies and make your changes:

    ```sh
    npm ci
    ```

4. Commit using [conventional commits](https://www.conventionalcommits.org):

    ```sh
    git commit -a -m 'feat: add new feature'
    ```

5. Push and open a pull request:

    ```sh
    git push origin <branch name>
    ```

### Lint of codebase

A set of different linters test the codebase and these must pass in order to get a pull request approved.

#### Linters in GitHub Action

When you create a pull request, a set of linters will run syntax and format checks on different file types in GitHub Actions by making use of a tool called [super-linter](https://github.com/github/super-linter). If any of the linters gives an error, this will be shown in the action connected to the pull request.

To speed up development, you can run linters as part of your local development environment.

### Available Scripts

| Command | Description |
| --------- | ------------- |
| `npm run dev` | Start backend + frontend in watch mode |
| `npm run build` | Build all packages for production |
| `npm run test` | Run all tests (backend, frontend) |
| `npm run lint` | Type-check + Biome lint |
| `npm run format:fix` | Autoformat with Biome |
| `npm run type-check` | TypeScript strict check across all packages |
| `npm run lint:fix` | Auto-fixes both lint violations and formatting problems |

#### Run super-linter locally

Since super-linter is using a Docker image in GitHub Actions, users of other editors may run it locally to lint the codebase. For complete instructions and guidance, see super-linter page for [running locally](https://github.com/github/super-linter/blob/main/docs/run-linter-locally.md).

Run the following command in a terminal to lint the codebase locally:

```sh
docker run --rm \
    -v $PWD:/tmp/lint \
    -e RUN_LOCAL=true \
    --env-file ".github/super-linter.env" \
    ghcr.io/super-linter/super-linter:slim-v9.0.0
```

#### Pull request checklist

Before opening a pull request (PR), please consider the following guidelines:

- Please make sure that the code builds perfectly fine on your local system.
- The PR will have to meet the code standard already available in the repository.
- Explanatory comments related to code functions are required. Please write code comments for a better understanding of the code for other developers.

And finally when you are satisfied with your changes, open a new PR.

<!-- markdownlint-disable MD034 -->
[issues]: https://github.com/AxisCommunications/axis-cloud-connect-ref-app/issues
[issues_new]: https://github.com/AxisCommunications/axis-cloud-connect-ref-app/issues/new
<!-- markdownlint-enable MD034 -->
