# AutoJudge

AutoJudge is a platform for hosting programming contests, where users can submit their solutions to problems and have them automatically evaluated. The platform supports multiple programming languages and provides a web interface for running the autojudge.

* **You can use this project as a CLI code runner. For this, check the [runner-cli](https://github.com/werlang/autojudge/tree/runner-cli) branch.**

* **Check Autojudge online version at [autojudge.io](https://autojudge.io).**

## Features

- Supports multiple programming languages, including C, JavaScript, Java, PHP, Python.
- Automatically detects the language based on the script's file extension.
- Provides a web interface for contest management, problem submission.
- For teams, the platform supports team registration, solution submission, and ranking.

## Requirements

- Docker

## Setup

Build the Docker images and start the containers:

```bash
docker compose up -d
```

Pull the images for the languages you will use. With the judge service running, you can pull the images with the following command:

```bash
docker exec judge npm run compilers
```
