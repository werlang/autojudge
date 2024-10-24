#!/bin/bash

file="code/$1"

if [ -z "$file" ]; then
  echo "Usage: $0 <script_file>"
  exit 1
fi

# check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running"
  exit 1
fi

# Extract the file extension
extension="${file##*.}"

pass=0
fail=0
isError=false

# Get every file from the 'input' directory
inputs=(./input/*)

for input in "${inputs[@]}"; do
  output="./output/$(basename "$input")"

  # Check if the output file exists
  if [ -f "$output" ]; then
    output_contents="$(<"$output")"
  else
    output_contents=""
  fi

  case "$extension" in
    "c")
      command="docker compose run --rm gcc /bin/bash -c \"gcc -o a.out $file && ./a.out < $input && rm ./a.out\""
      ;;
    "js")
      command="docker compose run --rm node node $file < $input"
      ;;
    "php")
      command="docker compose run --rm php php $file < $input"
      ;;
    "py")
      command="docker compose run --rm python python $file < $input"
      ;;
    "java")
      command="docker compose -f ../compose.yaml run --rm java /bin/bash -c \"javac $file && java -cp $(dirname "$file") $(basename "$file" .java) < $input && rm $(dirname "$file")/$(basename "$file" .java).class\""
      ;;
    *)
      echo "Unsupported file extension: .$extension"
      exit 1
      ;;
  esac

  # echo "Running command: $command"

  result_file="result.txt"

  # Execute the command in the background, redirect stdout to result file
  (eval "$command" > "$result_file" 2>&1 &)
  pid=$!

  while [ ! -s "$result_file" ]; do
    sleep 0.01
  done

  if $isError; then
    exit
  fi

  result="$(cat "$result_file")"

  if [ -n "$output_contents" ]; then
    # Compare result to expected output if output file exists
    if [[ "$result" != "$output_contents" ]]; then
      fail=$((fail + 1))
      echo "$input Wrong answer"
      echo "Got:"
      echo "$result"
      echo "Expected:"
      echo "$output_contents"
    else
      pass=$((pass + 1))
    fi
  else
    # If there is no output file, just print the result
    echo "Output file not found, printing result:"
    echo "$result"
  fi

  # Clean up result file
  rm -f "$result_file"

done

echo ""
echo "$pass passed, $fail failed"