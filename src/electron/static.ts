import http from 'http'
import path from 'path'
import electron from 'electron'
import fs from 'fs'

const publicDir = path.join(electron.app.getAppPath(), 'build')

const DEV_URL = `http://127.0.0.1:3100`

const MIME_DICT: { [k: string]: string } = {
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.js': 'application/x-javascript',
	'.css': 'text/css',
	'.map': 'application/json',
	'.json': 'application/json',
	'.txt': 'text/plain',
}

interface IServeWebFunction {
	(): Promise<void>
	address: string
}

export const serveWeb: IServeWebFunction = function () {
	let resolved = false
	return new Promise<void>((resolve, reject) => {
		const server = http.createServer((req, res) => {
			//处理错误
			req.on('error', err => console.error(err))
			res.on('error', err => console.error(err))
			try {
				//路径
				let file = path.join(publicDir, (req.url || '/').replace(/\?[\s\S]*$/, '').replace(/^\/+/, '') || 'index.html')
				if (!fs.existsSync(file)) {
					if (path.extname(file)) {
						res.statusCode = 404
						res.end('Not Found')
						return
					}
					else {
						file = path.join(publicDir, 'index.html')
					}
				}

				res.statusCode = 200
				const mime = MIME_DICT[path.extname(file)]
				if (mime) res.setHeader('Content-Type', mime)
				res.end(fs.readFileSync(file))
			} catch (err) {
				console.error(err)
			}
		})
		server.on('error', err => {
			if (!resolve) reject(err)
			else console.error(err)
			resolved = true
		})
		server.listen(11111, '0.0.0.0', () => {
			if (resolved) return
			resolved = true
			const addr = server.address()
			if (!addr || typeof addr == 'string') return reject(new Error('listen error'))
			serveWeb.address = `http://127.0.0.1:${addr.port}`
			resolve()
		})

	})
}

serveWeb.address = DEV_URL