



process.stdin.on('data', processData)
process.stdin.on('end', (data) => {
    console.log('end has happened' + data)
})
function processData(chunk) {
  console.log('line_start' + chunk + 'line_end')
}