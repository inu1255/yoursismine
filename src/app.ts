import * as noginx from "./proxy";
import * as express from "express";
import * as fs from "fs";
import * as pdd from './pdd'
import * as path from 'path'
noginx.dir('cert')
const proxy = noginx.app();
const app = express();

proxy.use(function(req, res, next) {
    if (req.method.toLowerCase() === "get") {
        let filename = process.cwd() + '/sites/' + req.headers["host"] + req.path;
        console.log(filename)
        if (fs.existsSync(filename)) {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.sendFile(filename)
            return
        }
    }
    next();
});
proxy.listen(9999, function() {
    console.log(`app listen: ${9999}`)
})

app.options('/', function(req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
    })
    res.end()
})

app.get('*', function(req, res) {
    if (req.query.anti_content) {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*'
        })
        pdd.config.anti_content = req.query.anti_content;
    }
    res.end('');
})

app.listen(9998, '0.0.0.0', function() {
    console.log(`app listen: ${9998}`)
})

async function main() {
    pdd.config.anti_content = "0anAfxnUXOcYY9dVURBSVHzQg9FngtS_1vCq85HHdyvS_SYwT12_17CIZaWahgYJYHmv3-LCvY7HlvbCfA4Gwlr3eGvi77iLyqY5o996m9i3IEPV96SfaZoWEGCOoB5-ukWWjCq_oDqyrLr5c4QnHiYRIPQ8N91hxi3IO-rOtxxp1T_eVN7xb7PD-SqIdHI5NHxkUT7tvF7MFFYK7IvZFxYdwXhwvpsKpVzNvfz2oi3X5c-VQPCSZb8WmEbJ3L5wmOKML3L7GWc3JWoKVKCCXuPsTEEgR8WsKJVteJ35QMgHTQ6bq_o7WKZzlCa8oHm4McS_n9PJ0U1szedj2bqCqwnXYbbUVQDq88tQfmwGrCbQgGIunpImVWIHSucyLheI3CpNJh3pZSvz3bfrsZAs8dF5h0YR2PQBIiRofwB24cbgMCwKLOBAPVQ-UkfpxtexrLZa0BKx7orMIRbH6CLBuCqUkL1TRawO2cuMYzKQI0JFLns8wQ-jWCZyV6GEwo-1niXoxkLIUVb6efK6qDVvwVg5ciaNk-kqjExs8Pz7bsOLzh3KhOhiZNzJfUO"
    new pdd.Pdd('7198455919407', "LNH3FH3IYFZEGJG3G5GOHBMXLNQHPARX4NMW4A6KF6GCRAQFPBKQ1032f82").start();
    new pdd.Pdd('6187437120', "D4JQGQXXBIDPR5F4BNG5DOGF7ATFXZM4AMH6PBFI5DYSU5TWM6GQ10040a8").start();
    new pdd.Pdd('4437892760', "CZS4AHKPINO25ASEQ3T2KFRZW7CYQPK6VY6EAMOL6Z56SD5I5JVA1029880").start();
}

main()

process.on('uncaughtException', console.error);