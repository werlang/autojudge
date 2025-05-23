# AutoJudge

AutoJudge-obi is a simple script that run your code in a Docker container. It is designed to help you test your code for the OBI (Olimpíada Brasileira de Informática) competition. The script automatically detects the programming language of your code and runs it in a Docker container, providing a clean and isolated environment for testing.

To know more about the OBI, visit the official website [here](https://olimpiada.ic.unicamp.br/).

## Features

- Supports multiple programming languages, including C, C++, JavaScript, Python and Java.
- Automatically detects the language based on the script's file extension.

## Requirements

You will need Docker installed on your system to run the AutoJudge script within a Docker container. If you don't have Docker installed, you can download it from the official website [here](https://www.docker.com/get-started).

## Setup

Before Running the autojudge, you will need to pull and build the docker images for each language supported. To do this, run the following command:

```bash
docker compose pull
```

## Usage

```bash
./autojudge.sh <script_file> <input_file>
```

Replace `<script_file>` with the filename of your code, and `<input_file>` with the filename of the test case. If no `<input_file>` is specified, the script will use the default `input` file.

You will see the output of your code in the console.

```bash
X = 3
```

There are example code files for each language. You can use them as a reference to create your own code.
