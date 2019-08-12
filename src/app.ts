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
        pdd.config.anti_content = req.query.anti_content;
    }
    res.end('');
})

app.listen(9998, function() {
    console.log(`app listen: ${9998}`)
})

async function main() {
    new pdd.Pdd('7198455919407', "ZK65GE5D2U3PXJWBMDS4UAPQO22XDKYWXPHE3CJZ2Y3GYQB3NZIA1032f82").start();
    new pdd.Pdd('6187437120', "D4JQGQXXBIDPR5F4BNG5DOGF7ATFXZM4AMH6PBFI5DYSU5TWM6GQ10040a8").start();
}

main()

process.on('uncaughtException', console.error);