#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import {exec} from "child_process";
import {App, forward} from "./proxy";

process.on("uncaughtException", console.error);

function getArgs(prefix: string) {
	let idx = process.argv.indexOf(prefix);
	if (idx < 0) return "";
	let v = process.argv[idx + 1];
	if (v == null || v.startsWith("--")) return true;
	if (isNaN(+v)) return v;
	return +v;
}

async function main() {
	const proxy = new App();
	if (!getArgs("--nocert")) {
		const cert = getArgs("--cert");
		await proxy.setCertDir(!cert || typeof cert != "string" ? "cert" : cert);
	}

	// 证书需要被安装并信任，可以在此打开该目录并给出提示，也可以进行其他操作
	// const isWin = /^win/.test(process.platform);
	// const certDir = path.join(process.cwd(), "cert");
	// if (isWin) {
	// 	exec("start .", {cwd: certDir});
	// } else {
	// 	exec("open .", {cwd: certDir});
	// }

	proxy.httpFilter = (url) => {
		return !/:(443|4430|8443)$/.test(url);
	};

	// proxy.httpsFilter = (url) => false;

	function mkdirs(dir: string) {
		if (fs.existsSync(dir)) return;
		mkdirs(path.dirname(dir));
		fs.mkdirSync(dir);
	}

	proxy.use(async function (req, res, next) {
		if (req.method.toLowerCase() === "get") {
			let filename = process.cwd() + "/sites/" + req.headers.host + req.path;
			if (filename.endsWith("/")) filename += "index.html";
			fs.access(filename, function (err) {
				if (err) {
					console.error("cache", filename);
					delete req.headers["accept-encoding"];
					forward(req, function (x) {
						res.writeHead(x.statusCode, x.statusMessage, x.headers);
						x.once("error", (e) => {
							// FIXME: 这里可能有问题
							res.end();
						});
						mkdirs(path.dirname(filename));
						try {
							x.pipe(fs.createWriteStream(filename));
						} catch (error) {
							console.error(error);
						}
						x.pipe(res);
					}).once("error", (e) => {
						res.writeHead(500, e.message);
						res.end();
					});
				} else {
					console.error("send", filename);
					res.setHeader("Access-Control-Allow-Origin", "*");
					res.sendFile(filename);
				}
			});
			return;
		}
		next();
	});
	let port = +getArgs("--port") || 9999;
	proxy.listen(port, function () {
		console.log(`app listen: ${port}`);
	});
}

main().catch(function (err) {
	console.log(err);
});
