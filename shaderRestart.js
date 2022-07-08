const utils = require('./utils')
const pixels = require('image-pixels')
const fs = require('fs');
const split = require('split');
const myArgs = process.argv.slice(2);

async function createReader(){
    process.stdin.setEncoding(null)
    process.stdin.pipe(split('END_OF_MESSAGE')).on('data', processData)
    process.stdin.on('end', async (data) => {
        // console.log('end has happened' + data)
        // await createReader()
    })
    
    function processData(chunk) {
        message_count += 1;
        // console.log(message_count)
        if (chunk.charAt(0) === '{') {
            const message = JSON.parse(chunk);
            setShape(message.width, message.height)
            process.stdout.write(chunk + "\n")
            return
        }
        // if (chunk.charAt(0) === 'E') {
        //     console.log('maybe end of message in chunk')
        // }
        // console.log(chunk);
        // let data = enc.encode(chunk)
        // for (var i = 0; i < buffer.length; i++) {
        //     myBuffer.push(buffer[i]);
        // }
        // console.log(myBuffer)

        // data =  new Uint8Array(chunk.trim())
        pixels(Buffer.from(chunk, 'base64'), { shape: [shape.w, shape.h]}).then((ImageData) => {
            if (message_count == 3) {
                // console.log(ImageData)
            }
            main(ImageData)
        })
        // main({data: pixels(chunk, { shape: [w, h]}), height: shape.h, width: shape.w}).then((data) => {
        //     console.log('done')
        // })
    }
}

createReader()