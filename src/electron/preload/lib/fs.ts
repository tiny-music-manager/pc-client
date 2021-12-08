import fs from 'fs'
import path from 'path'
import JSON5 from 'json5'

export const fsApi = {
	isdir(pathname: string): boolean {
		return fs.statSync(pathname).isDirectory()
	},
	readdir(dirname: string): Array<string> {
		return fs.readdirSync(dirname)
	},
	readfile(pathname: string): Buffer {
		return fs.readFileSync(pathname)
	},
	readJSON(pathname: string): any {
		try {
			return JSON5.parse(fs.readFileSync(pathname) + '')
		} catch (err) {
			return undefined
		}
	},
	writefile(pathname: string, data: string | Buffer) {
		if (!fs.existsSync(path.dirname(pathname))) fs.mkdirSync(path.dirname(pathname), { recursive: true })
		fs.writeFileSync(pathname, data)
	},
	exists(pathname: string) {
		return fs.existsSync(pathname)
	}
}