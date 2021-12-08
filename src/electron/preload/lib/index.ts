import electron from 'electron'
import { appdata } from "./appdata"
import { fsApi } from "./fs"
import { request } from "./request"
import { tray } from './tray'

export const commonApi = {
	appdata, fs: fsApi, request, tray,
	get webUrl() {
		return electron.ipcRenderer.sendSync('webserver.static')
	},
}