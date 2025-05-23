#!/bin/bash

file="$1"
input="$2"

if [ -z "$file" ]; then
  echo "Usage: $0 <script_file>"
  exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running"
  exit 1
fi

# Extract the file extension
extension="${file##*.}"

if [ ! -f "$input" ]; then
  input="input"
fi

case "$extension" in
  "c")
    command="docker compose run --rm --no-TTY gcc /bin/bash -c \"gcc -o a.out $file && ./a.out < $input && rm ./a.out\""
    ;;
  "cpp")
    command="docker compose run --rm --no-TTY gcc /bin/bash -c \"g++ -o a.out $file && ./a.out < $input && rm ./a.out\""
    ;;
  "js")
    command="docker compose run --rm --no-TTY node node $file < $input"
    ;;
  "py")
    command="docker compose run --rm --no-TTY python python $file < $input"
    ;;
  "java")
    command="docker compose run --rm --no-TTY java /bin/bash -c \"javac $file && java -cp $(dirname "$file") $(basename "$file" .java) < $input && rm $(dirname "$file")/$(basename "$file" .java).class\""
    ;;
  *)
    echo "Unsupported file extension: .$extension"
    exit 1
    ;;
esac

# Execute the command and print the result to the console
eval "$command"