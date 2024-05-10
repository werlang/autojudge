#!/bin/sh

file="$1"
tmpdir="$2"

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
inputs="./input/*"

# execute command to create network, ignore if exsists
docker network create --driver bridge judge_runner 2> /dev/null

for input_file in $inputs; do
  output="./output/$(basename "$input_file")"
  output_contents="$(cat "$output")"
   
  # create .env file and set TMPDIR, FILE and FILENAME
  echo "TMPDIR=$tmpdir" > .env
  echo "FILE=$file" >> .env
  echo "INPUT=$input_file" >> .env

  case "$extension" in
    "c")
      command="docker compose -f compilers.yaml run --rm gcc"
      ;;
    "js")
      command="docker compose -f compilers.yaml run --rm node"
      ;;
    "php")
      command="docker compose -f compilers.yaml run --rm php"
      ;;
    "py")
      command="docker compose -f compilers.yaml run --rm python"
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

  if [ "$result" != "$output_contents" ]; then
    fail=$((fail + 1))
    echo "$input_file Wrong answer"
    echo "Got:"
    echo "$result"
    echo "Expected:"
    echo "$output_contents"
    echo ""
  else
    pass=$((pass + 1))
  fi

  # Clean up result file
  rm -f "$result_file"

done

echo "$pass passed, $fail failed"
