# AutoJudge

AutoJudge is a platform for hosting programming contests, where users can submit their solutions to problems and have them automatically evaluated. The platform supports multiple programming languages and provides a web interface for running the autojudge.

* **You can use this project as a CLI code runner. For this, check the [runner-cli](https://github.com/werlang/autojudge/tree/runner-cli) branch.**

* **Check Autojudge online version at [autojudge.io](https://autojudge.io).**

## Features

- Supports multiple programming languages, including C, C++, JavaScript, Java, PHP, Python.
- Automatically detects the language based on the script's file extension.
- Fully automated evaluation of the solutions.
- Provides a web interface for contest management, problem submission.
- For teams, the platform supports team registration, solution submission, and ranking.

## Requirements

- Docker

## Setup

To run the AutoJudge platform, you can either run the setup script or follow the manual setup instructions.

### 1. Setup script (recommended)

- Run the setup script:

```bash
./setup.sh
```

### 2. Manual setup

If you prefer to set up the platform manually, follow the instructions below.

- Rename the `.env.example` file to `.env` and set the environment variables inside it. It is important that you set the following variables:

```bash
NODE_ENV=production # if you are running the platform in production (like in a contest)
MYSQL_ROOT_PASSWORD=your_password # set the root password for the MySQL database
LIVE_RELOAD=false # to disable live reload of js and css files
JWT_SECRET=your_secret # set the secret for JWT token. A random string is recommended
BACKGROUND_TOKEN=your_secret # set the secret for background tasks. A random string is recommended
LOCAL_SERVER=your_ip # set the IP address of the server if you are running a local contest. Otherwise, keep false
```

- Pull the images for the languages the judge will support:

```bash
docker pull gcc:9.5.0
docker pull node:22
docker pull php:8.2-cli
docker pull python:3.11
docker pull openjdk:24
```

- Build the Docker images and start the containers:

If you are running the as a local contest, use the `compose.local.yaml` file:

```bash
docker compose -f compose.local.yaml up -d
```

Otherwise, use the `docker-compose.yaml` file:

```bash
docker compose up -d
```

## Usage

After the containers are up and running, you can access the platform at `http://localhost:3000` (or the IP address you set in the `.env` file) if you are running a local contest. Otherwise, you can access the platform at `https://localtest.me`.