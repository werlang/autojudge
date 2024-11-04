# AutoJudge

AutoJudge is a simple script that automates the process of running test cases for different programming languages. It can be used to evaluate the correctness of solutions for various programming problems.

## Features

- Supports multiple programming languages, including C, JavaScript, PHP, Python and Java.
- Automatically detects the language based on the script's file extension.
- Compiles and runs code with test cases from the `input` directory.
- Compares the output with expected results from the `output` directory.
- Provides pass/fail statistics for each test case.

## Requirements

You will need Docker installed on your system to run the AutoJudge script within a Docker container. If you don't have Docker installed, you can download it from the official website [here](https://www.docker.com/get-started).

## Setup

Before Running the autojudge, you will need to pull and build the docker images for each language supported. To do this, run the following command:

```bash
docker compose up
docker compose down
```

## Usage

You can either run the simple `autojudge.sh` or the full `autojudge.sh` script.

### Simple script

Go to the `simple` folder, and run the following command:

```bash
./autojudge.sh <script_file> <input_file>
```

Replace `<script_file>` with the filename of your code, and `<input_file>` with the filename of the test case.

You will see the output of your code in the console.

```bash
X = 3
```

### Full test case testing script

Go to the `runs` folder, and run the following command:

```bash
./autojudge.sh <script_file>
```
Replace `<script_file>` with the filename of your code, and the script will automatically detect the language based on the file extension.

You will receive a summary of the pass/fail statistics for each test case.

## Input/output format

The script will look for input and output files in the `input` and `output` directories respectively. The input and output files must have the same name.

```
input/
    test00
    test01
    test02
    ...
output/
    test00
    test01
    test02
    ...
autojudge.sh
```

## Results

If the output of your code matches the expected output, you will see a `passed` message. Otherwise, you will see a `failed` message.

```bash
10 passed, 0 failed
```

For the `failed` cases, the script will display the expected output and the actual output.

```bash
./input/teste4 Wrong answer
Got:
X = 13
Expected:
X = 3

9 passed, 1 failed
```

In the case of a runtime/compilation error, the script will display the error message.

If no output file is found for a test case, the script will display the following message, and print the result to the console.

```bash
Output file not found, printing result:
X = 3
```


## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](/LICENSE) file for details.
