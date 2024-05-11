# AutoJudge

AutoJudge is a simple script that automates the process of running test cases for different programming languages. It can be used to evaluate the correctness of solutions for various programming problems.

* **You can use this project as a CLI code runner. For this, check the [runner-cli](https://github.com/werlang/autojudge/tree/runner-cli) branch.**

* **Check Autojudge online version at [autojudge.werlang.site](https://autojudge.werlang.site).**

## Features

- Supports multiple programming languages, including C, JavaScript, PHP, Python.
- Automatically detects the language based on the script's file extension.
- Compiles and runs code with test cases from the `input` directory.
- Compares the output with expected results from the `output` directory.
- Provides pass/fail statistics for each test case.
- Web interface allowing to save problems on _local storage_ and run autojudge in the browser.

## Requirements

- Docker

## Setup

Build the Docker images and start the containers:

```bash
docker compose up -d
```

Pull the images for the languages you will use.

```bash
docker pull python:3.11
docker pull node:16
docker pull php:8.2-cli
docker pull gcc:9.5.0
```

Build the front-end css and js files. First enter the container:

```bash
docker exec -it autojudge-web-1 bash
```

Then use webpack to build the files:

```bash
npx webpack
```

Hit `Ctrl+C` and `exit` to leave the container.

## Usage

Nginx will serve the front-end at `https://autojudge.localhost`. You can access the web interface to run the autojudge. From there, you can check the instructions on how to use the tool.