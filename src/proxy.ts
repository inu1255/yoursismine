import * as https from "https";
import * as http from "http";
import * as net from "net";
import {URL} from "url";
import * as CertManager from "node-easy-cert";
import * as WebSocket from "ws";
import * as express from "express";
import {ApplicationRequestHandler, PathParams} from "express-serve-static-core";
// var wss = new WebSocket.Server({port: 3000});
// wss.on("connection", function (ws, req) {
// 	ws.onmessage = function (e) {
// 		ws.send(e.data);
// 	};
// });
const crtMgrPool = new Map<string, Promise<CertManager>>();

const cert = `-----BEGIN CERTIFICATE-----
MIIDbDCCAlSgAwIBAgIQM4na42GvebBMnI5wV/YMxjANBgkqhkiG9w0BAQsFADBm
MQswCQYDVQQGEwJDTjEUMBIGA1UEChMLeW91cnNpc21pbmUxCzAJBgNVBAgTAlND
MSMwIQYDVQQLExpodHRwczovL2dpdGh1Yi5jb20vaW51MTI1NTEPMA0GA1UEAxMG
bm9naW54MB4XDTIxMDkxNzA4MjUyMloXDTIzMTIyMTA4MjUyMlowYTELMAkGA1UE
BhMCQ04xFDASBgNVBAoTC3lvdXJzaXNtaW5lMQswCQYDVQQIEwJTQzEjMCEGA1UE
CxMaaHR0cHM6Ly9naXRodWIuY29tL2ludTEyNTUxCjAIBgNVBAMTASowggEiMA0G
CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDIp4YGVPtDFpSHfV6WAeVhTGcfO5nV
0kWWeV+gRK1n9MWxgQNGsxdrsG1rfKzCLiJZ6k0RwlEh6KYcSN3I89PabgBQtHPS
ZsNp1+9A1SSLm1bSx6NcwKoLnLJNwxkUkC81qjbzFnf8Ota+jbW2Ust9ddpgm5hy
r/6NjcDeVIjVxb7tO5vd9MSv1bBATeOTC2uegrWLEunkMudil/xBXHNPascFB1wT
Szw7VKlB6O1lyFHb7QQSNfmqA3irBFKUEv9N6io9DJjd4tErlPxdkay/xue1Jk+N
QdcK+9YaGelgVj7i2Gnh8R9pTDi7DDMIUqOyj11BGOPod4MCEEGNCzTLAgMBAAGj
GzAZMAkGA1UdEwQCMAAwDAYDVR0RBAUwA4IBKjANBgkqhkiG9w0BAQsFAAOCAQEA
ee28vMnLzXn+NdIYHwcauW75clriJ64fKAdSwviScR/8u+/ACTZYblWEVduxKU0D
yGmGAYSVT6IKdrm1An2QI5+T/mq7psQosumZPhBnkWisYVXEXAlthJ+AWMa/EHO3
5uuXOuabe/scj4y5lvL9dZ0Mr3jRW+gLVu7Gl2XpYzh36jldfKLaTr5gw6hUwD0+
TaaMI/uMEjckHdf8/3aw7b+Go24INUSsyQyICXVOFzJOeoIJcvFglnejrv7c/mLl
/IIyImFvSLh26qQfoF5jfmrM5eU/mnI1ZGL4f+uZauKzI85xZernBHHykdpRQuCM
A/9YSn9B7AOzD+Hin5pfug==
-----END CERTIFICATE-----`;
const key = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAyKeGBlT7QxaUh31elgHlYUxnHzuZ1dJFlnlfoEStZ/TFsYED
RrMXa7Bta3yswi4iWepNEcJRIeimHEjdyPPT2m4AULRz0mbDadfvQNUki5tW0sej
XMCqC5yyTcMZFJAvNao28xZ3/DrWvo21tlLLfXXaYJuYcq/+jY3A3lSI1cW+7Tub
3fTEr9WwQE3jkwtrnoK1ixLp5DLnYpf8QVxzT2rHBQdcE0s8O1SpQejtZchR2+0E
EjX5qgN4qwRSlBL/TeoqPQyY3eLRK5T8XZGsv8bntSZPjUHXCvvWGhnpYFY+4thp
4fEfaUw4uwwzCFKjso9dQRjj6HeDAhBBjQs0ywIDAQABAoIBAHX0dQc34dUYawwT
GQ1Z4/wErAJiSRa3W40PoLVYag/YhnbIfqKLGVOHDWvIiM5FzI/K+q9b6dHjL/Mk
qqw9GecoDytiSUwAeRO5ir40Dh27nZifH1uhLtVQskigThgWgoorm83fAX3XIPI3
4ABkP5drNorgLQgOibexAxYv35i6cf6RnWI7oXyGxCgrdbe5lpVyse35rVsYkyi/
kgOH0KdFc1S8IvzhFCWEKkbBr9JXPp3dKlNcqzAW1lf9uIrUgsHegCYCz05Yt/yd
lihCCMJw4hkXRrpIXi8N3NQ0C4GiMWy7bN5b7miS7v4yaaGonNHGAuOaZor6UDJi
M1Rg9oECgYEA5DkvY5eNVO9eET6BGQa98mINwVvCO+RcAVNTopOyQS6eWc/20HPX
/l/5Qgs83VReivl7xtAckfYqO756rxBMmeJ1wnR0ungwfL4srlzUTPhNy3kT6Ib3
5Ob453QAS1d+X70anv1HawN1l83+mCPGKI/C6OnT0lJZlqDQ21S4BysCgYEA4RNd
P2LS88jCJTa44kn3BZhpy2u4NgqJw25dCZ0eyQ1lFOi7Yv1J2cEzZwjgP2flSQYB
0SSMsJd2KQKti0VHmgSY307W9ajt3ZTvFX76QsqIN5XIHTP8JQtOOCP84wl04fw7
Xq0o4dvNaI6G+zP0CAfyqHPVilPjdDxyHWNyuOECgYB81s8WUktMH5e8JQ2nK+nx
UTOnBlNsQZEWZIdGUjZas26JQFoJUqTfD46gUtdbVpBUwv2zFhnaueYGQj6Hzomo
T5kM4nkLmz0ir0BvrHWxGM4tNDDwrAuj2bhjmy+iBt0o759FQtSzM/Q6MsNGY6M8
gs8iau2kiclZvOQiZeg4ewKBgQCyovrcZyQE5u7oOFFvEMNlBn3ZPOqcwaprmPlw
uuqHKgFzIfAv9dYaZRPWEB5jVKOPXJwukTK0qdHXZM+2fMsCe+mVOu6zVVtNBXro
dbpNLpAEhfWo7+yMvjdbqXx5+bRx9A5u60JKWHjkJlMNp0Nk6GH4vs7aFhCt3Ze4
qYiRIQKBgQCjwOK9GyHbuqlsGvjqiF+xp5dtAmOj5GoFDMTouDcmwMhnJIPvOKs7
lvcXS7+E9OtnDRuG+jeh4CdNruhtHBY0uasGM+AXIONS44CfffVmIPabpFBOSIi/
D3S1Gj/aBdgmpORf9Lqj5sbIeU3yznA4qsewoZZ3IcFW0ysQKtcOSg==
-----END RSA PRIVATE KEY-----`;

function getCertManager(dir: string) {
	let pms = crtMgrPool.get(dir);
	if (pms) return pms;
	pms = new Promise<any>((resolve, reject) => {
		let crtMgr = new CertManager({
			rootDirPath: dir,
			defaultCertAttrs: [
				{name: "countryName", value: "CN"},
				{name: "organizationName", value: "yoursismine"},
				{shortName: "ST", value: "SC"},
				{shortName: "OU", value: "https://github.com/inu1255"},
			],
		});
		crtMgr.generateRootCA({commonName: "noginx"}, function (error, keyPath, crtPath) {
			// 如果根证书已经存在，且没有设置overwrite为true，则需要捕获
			if (error && error != "ROOT_CA_EXISTED") {
				return reject(error);
			}
			resolve(crtMgr);
		});
	});
	pms.catch(() => {
		crtMgrPool.delete(dir);
	});
	crtMgrPool.set(dir, pms);
	return pms;
}

export type WebsocketRequestHandler = (
	ws: WebSocket,
	req: http.IncomingMessage,
	next: () => void
) => void;

export class App {
	protected app: express.Express;
	protected self_https: {[key: string]: Promise<number>};
	protected server: http.Server;
	protected crtMgr: CertManager;
	protected wsMiddleWares: {route: PathParams; middleware: WebsocketRequestHandler}[];
	protected wss: WebSocket.Server;
	httpFilter: (url: string) => boolean;
	httpsFilter: (url: string) => boolean;
	port: number;
	use: ApplicationRequestHandler<express.Express>;
	constructor() {
		let app = express();
		let server = http.createServer(app);
		let wss = new WebSocket.Server({noServer: true});
		this.self_https = {};
		this.use = function () {
			app.use.apply(app, arguments);
		} as any;
		this.app = app as any;
		this.server = server;
		this.wss = wss;
		this.wsMiddleWares = [];
		app.disable("x-powered-by");
		this.httpFilter = function (url) {
			return !url.endsWith(":443") && !url.endsWith(":8443") && !url.endsWith(":4430");
		};
		server.on("connect", (req, cltSocket, head) => {
			var srvSocket: net.Socket;
			var [host, port] = req.url.split(":");
			if (this.httpFilter(req.url)) {
				srvSocket = net.connect({host: "localhost", port: this.port}, function () {
					cltSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
					srvSocket.write(head);
					cltSocket.pipe(srvSocket);
					srvSocket.pipe(cltSocket);
					srvSocket.on("error", (err) => {
						console.error("xeeee", err);
					});
					cltSocket.on("error", (err) => {
						console.error("xeeee1", err);
					});
				});
			} else if (!this.httpsFilter || this.httpsFilter(req.url)) {
				this.fakeSite(host).then(function (port) {
					srvSocket = net.connect({host: "localhost", port}, function () {
						cltSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
						srvSocket.write(head);
						cltSocket.pipe(srvSocket);
						srvSocket.pipe(cltSocket);
					});
					srvSocket.on("error", (err) => {
						console.error("xeeee2", err);
					});
					cltSocket.on("error", (err) => {
						console.error("xeeee22", err);
					});
				});
			} else {
				srvSocket = net.connect({host, port}, function () {
					cltSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
					srvSocket.write(head);
					cltSocket.pipe(srvSocket);
					srvSocket.pipe(cltSocket);
					srvSocket.on("error", (err) => {
						console.error("xeeee3", err);
					});
					cltSocket.on("error", (err) => {
						console.error("xeeee33", err);
					});
				});
			}
		});
		wss.on("connection", (ws: WebSocket, req: http.IncomingMessage, protocol: string) => {
			// protocol = protocol server instanceof http.Server ? "ws" : "wss";
			forwardWS(protocol, ws, req);
		});
	}

	protected wsServer(server: http.Server | https.Server) {
		let protocol = server instanceof http.Server ? "ws" : "wss";
		server.on("upgrade", (req, socket, head) => {
			this.wss.handleUpgrade(req, socket, head, (ws) => {
				this.wss.emit("connection", ws, req, protocol);
			});
		});
	}

	ws(route: PathParams, middleware: WebsocketRequestHandler) {
		this.wsMiddleWares.push({route, middleware});
	}

	setCertDir(dir = "cert") {
		return getCertManager(dir).then((x) => (this.crtMgr = x));
	}

	fakeSite(domain: string): Promise<number> {
		let pms = this.self_https[domain];
		if (pms) return pms;
		pms = new Promise((resolve, reject) => {
			const onCert = (error: any, key: string, cert: string) => {
				if (error) return reject(error);
				var server = https.createServer({key, cert}, this.app);
				this.wsServer(server);
				server.once("error", (err) => {
					this.self_https[domain] = null;
					reject(err);
				});
				server.listen(0, () => {
					let addr = server.address();
					if (typeof addr != "string") {
						resolve(addr.port);
					}
				});
			};
			if (this.crtMgr) this.crtMgr.getCertificate(domain, onCert);
			else onCert(null, key, cert);
		});
		this.self_https[domain] = pms;
		pms.catch(() => {
			this.self_https[domain] = null;
		});
		return pms;
	}

	listen(port: number, listeningListener?: () => void) {
		this.port = port;
		// 默认: 直接转发请求
		this.app.use(function (req, res, next) {
			forward(req, (x) => {
				res.writeHead(x.statusCode, x.statusMessage, x.headers);
				x.once("error", (e) => {
					// FIXME: 这里可能有问题
					res.end();
				});
				x.pipe(res);
			}).once("error", (e) => {
				res.writeHead(500, e.message);
				res.end();
			});
		});
		this.server.listen.apply(this.server, arguments);
	}

	close(cb: (err?: Error) => void) {
		this.server.close(cb);
	}
}

/**
 * 转发请求
 * @param {express.Request} req
 */
export function forward(req: express.Request, onRes: (res: http.IncomingMessage) => void) {
	var url = req.url;
	if (!/^https?:/.test(url)) url = req.protocol + "://" + req.headers.host + req.url;
	var u = new URL(url);
	let host = u.hostname;
	let port = u.port;
	let path = u.pathname + u.search;
	let username = u.username;
	let password = u.password;
	let r = (u.protocol == "http:" ? http : https).request(
		{
			host,
			port,
			path,
			username,
			password,
			method: req.method,
			headers: req.headers,
			rejectUnauthorized: false,
		},
		function (res) {
			onRes(res);
		}
	);
	if (req.body) req.body.pipe(r);
	else if (typeof req.pipe === "function") req.pipe(r);
	else r.end();
	return r;
}

export function pipeWebsocket(w1: WebSocket, w2: WebSocket) {
	var pms =
		w2.readyState == 0
			? new Promise<void>((resolve, reject) => {
					w2.once("open", resolve);
			  })
			: Promise.resolve();
	w1.onmessage = function (e) {
		if (w2.readyState > 1) return;
		pms = pms.then(() => w2.send(e.data)).catch((x) => x);
	};
	w1.onclose = function (e) {
		w2.close();
	};
	w1.onerror = function (e) {
		w2.close();
	};
}

export function forwardWS(protocol: string, ws: WebSocket, req: http.IncomingMessage) {
	let url = protocol + "://" + req.headers.host + req.url;
	let headers = Object.assign({}, req.headers);
	["sec-websocket-version", "upgrade", "sec-websocket-key", "sec-websocket-extensions"].forEach(
		(k) => delete headers[k]
	);
	let client = new WebSocket(url, {
		method: req.method,
		headers: headers,
		rejectUnauthorized: false,
	});
	pipeWebsocket(ws, client);
	pipeWebsocket(client, ws);
}
