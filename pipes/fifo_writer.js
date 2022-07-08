const fs              = require('fs');
const { spawn, fork } = require('child_process');

const path_a = 'pipe_a';
const path_b = 'pipe_b';
let fifo_b   = spawn('mkfifo', [path_b]);  // Create Pipe B

fifo_b.on('exit', function(status) {
    console.log('Created Pipe B');

    const fd   = fs.openSync(path_b, 'r+');
    let fifoRs = fs.createReadStream(null, { fd });
    let fifoWs = fs.createWriteStream(path_a);

    console.log('Ready to write')

    setInterval(() => {
        console.log('-----   Send packet   -----');
        fifoWs.write(`${new Date().toISOString()}`);
    }, 1000);  // Write data at 1 second interval

    fifoRs.on('data', data => {

        now_time  = new Date();
        sent_time = new Date(data.toString());
        latency   = (now_time - sent_time);

        console.log('----- Received packet -----');
        console.log('    Date   : ' + data.toString());
        console.log('    Latency: ' + latency.toString() + ' ms');
    });
});