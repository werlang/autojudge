process.openStdin().on('data', data => {
    const input = data.toString().trim().split(/\s+/g);
    main(input);
});

function main(input) {
    const a = parseInt(input[0]);
    const b = parseInt(input[1]);
    console.log(`X = ${a + b}`);
}
