import fs from 'fs'
import path from 'path'
import electron from 'electron'
import { dirs } from './dirs'
import type { IUploadInfo } from '../../../pages/manage/upload'
import type { IUConfig } from '../../../libs/datatype'

function readJSON(jpath: string) {
	if (!fs.existsSync(jpath)) return null
	try {
		return JSON.parse(fs.readFileSync(jpath) + '') ?? null
	} catch (err) {
		return null
	}
}

//应用数据变更
if (electron.ipcRenderer) electron.ipcRenderer.on('appdata.update', (evt, type) => {
	if (!appdataUpdateCBs[type]) return
	appdataUpdateCBs[type].forEach(func => func(type))
})

const appdataUpdateCBs: { [i: string]: Array<(type: string) => any> } = {}

//用于发送IPC消息
const ipcMessage = (channel: string, msg: string) => electron.ipcRenderer && electron.ipcRenderer.send(channel, msg)


export const appdata = {
	//监听变更
	onUpdate(type: string, cb: () => any) {
		if (!appdataUpdateCBs[type]) appdataUpdateCBs[type] = []
		appdataUpdateCBs[type].push(cb)
	},
	//用户token
	getUserToken(): string | null {
		return readJSON(path.join(dirs.configdir, 'user-token.json'))?.token ?? null
	},
	setUserToken(token: string) {
		if (!token) return
		fs.writeFileSync(path.join(dirs.configdir, 'user-token.json'), JSON.stringify({ token }))
		ipcMessage('appdata.update', 'user-token')
	},
	//上传列表
	getUploads(): Array<IUploadInfo> {
		return readJSON(path.join(dirs.configdir, 'uploads.json')) ?? []
	},
	setUploads(data: Array<IUploadInfo>) {
		if (!data) return
		fs.writeFileSync(path.join(dirs.configdir, 'uploads.json'), JSON.stringify(data))
		ipcMessage('appdata.update', 'uploads')
	},
	//歌词配置
	getLyricConfig(): IUConfig['lyric'] | null {
		return readJSON(path.join(dirs.configdir, 'lyric.json')) ?? null
	},
	setLyricConfig(config: IUConfig['lyric']) {
		if (!config) return
		fs.writeFileSync(path.join(dirs.configdir, 'lyric.json'), JSON.stringify(config))
		ipcMessage('appdata.update', 'config.lyric')
	},
	//系统配置
	getSystemConfig(): { theme: 'auto' | 'dark' | 'light', color: string, font: string } {
		return readJSON(path.join(dirs.configdir, 'system.json')) ?? { theme: 'auto', color: 'green', font: '' }
	},
	setSystemConfig(config: { theme: 'auto' | 'dark' | 'light', color: string, font: string }) {
		if (!config) return
		fs.writeFileSync(path.join(dirs.configdir, 'system.json'), JSON.stringify(config))
		ipcMessage('appdata.update', 'config.system')
	},
	//网络配置
	getNetworkAddress(): { current: string, addresses: Array<string> } | null {
		return readJSON(path.join(dirs.configdir, 'netaddr.json')) ?? null
	},
	setNetworkAddress(config: { current: string, addresses: Array<string> }) {
		if (!config) return
		fs.writeFileSync(path.join(dirs.configdir, 'netaddr.json'), JSON.stringify(config))
		ipcMessage('appdata.update', 'config.netaddr')
	},
	//播放器配置
	getPlayerConfig(): { volume: number, method: string, current: number, list: Array<any> } {
		return readJSON(path.join(dirs.configdir, 'player.json')) ?? { volume: 1, method: 'list', current: 0, list: [] }
	},
	setPlayerConfig(config: { volume: number, method: string, current: number, list: Array<any> }) {
		if (!config) return
		fs.writeFileSync(path.join(dirs.configdir, 'player.json'), JSON.stringify(config))
		ipcMessage('appdata.update', 'config.player')
	},
}