import * as noginx from "./proxy";
import * as cofs from "fs-extra";
noginx.dir('cert')
const proxy = noginx.app();

proxy.httpFilter = url => {
    return !/:(443|4430|8443)$/.test(url)
}

proxy.use(async function(req, res, next) {
    if (req.method.toLowerCase() === "get") {
        let filename = process.cwd() + '/sites/' + req.headers["host"] + req.path;
        if (await cofs.pathExists(filename)) {
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

process.on('uncaughtException', console.error);