/* eslint-disable no-eval */
import fs from 'fs'
import path from 'path'
import electron from 'electron'
import * as mm from 'music-metadata'
import { LyricParser, TLyricType } from '../lyric'
import zlib from 'zlib'
import { commonApi } from './lib'
import { dirs } from './lib/dirs'

let themeInit = false

function updateTheme(theme: { theme: string, color: string, font: string }) {
	if (!themeInit) {
		const style = document.createElement('style')
		style.innerHTML = `*{transition:unset !important}`
		document.head.appendChild(style)
		themeInit = true
		setTimeout(() => {
			document.head.removeChild(style)
		}, 200);
	}
	document.body.setAttribute('theme', theme.theme)
	document.body.setAttribute('color', theme.color)
	document.body.style.fontFamily = theme.font ? `font_${theme.font}` : ''
}

function main() {
	const windowId = electron.ipcRenderer.sendSync('window.id')
	const env = electron.ipcRenderer.sendSync('window.env')
	const theme = electron.ipcRenderer.sendSync('theme.current')
	updateTheme(theme)
	if (!(env?.hideAlways ?? false)) electron.ipcRenderer.sendSync('window.show', true)		//显示出当前窗口

	type TWindowExitCB = (data: any) => any
	type TWindowCloseCB = () => any

	const exitCBDict: { [i: number]: TWindowExitCB } = {}
	const closeCBDict: { [i: number]: TWindowCloseCB } = {}

	/**
	 * 创建窗口
	 * @param option 窗口选项
	 */
	function createWindow(option: electron.BrowserWindowConstructorOptions) {
		const winId = electron.ipcRenderer.sendSync('window.create', option)
		return {
			openFile: (filename: string) => electron.ipcRenderer.sendSync('window.openFile', winId, filename),
			openURL: (url: string) => electron.ipcRenderer.sendSync('window.openURL', winId, url),
			close: () => electron.ipcRenderer.sendSync('window.close', winId),
			onExit: (cb: TWindowExitCB) => exitCBDict[winId] = cb,
			onClose: (cb: TWindowCloseCB) => closeCBDict[winId] = cb,
		}
	}

	//窗口关闭
	electron.ipcRenderer.on('window.closed', (evt, { id }) => {
		closeCBDict[id]?.()
	})

	//窗口退出
	electron.ipcRenderer.on('window.exit', (evt, { id, data }) => {
		exitCBDict[id]?.(data)
	})

	const audioApi = {
		//获取时长
		duration(file: string): Promise<number> {
			return mm.parseFile(file).then(res => res.format.duration ?? 0)
		},
		//获取比特率
		bitrate(file: string): Promise<number> {
			return mm.parseFile(file).then(res => res.format.bitrate ?? res.format.sampleRate ?? 0)
		},
	}

	const lyricApi = {
		//解密第三方歌词
		fromBase64(type: TLyricType, content: string) {
			return LyricParser.fromBase64(type, content).lyric
		},
		//解密歌词
		parseLyric(lyric: string) {
			return JSON.parse(zlib.gunzipSync(Buffer.from(lyric, 'base64')) + '')
		},
		//设置桌面歌词
		dlyricConfig(type: string, data: any) {
			electron.ipcRenderer.sendSync('dlyric.config', { type, data })
		},
		//桌面歌词儿显示、隐藏
		show(show: boolean) {
			electron.ipcRenderer.sendSync('dlyric.show', show)
		},
		//桌面歌词是否显示
		isShowing() {
			return electron.ipcRenderer.sendSync('dlyric.showing')
		},
	}

	const nativeApi = {
		...commonApi,
		env,
		lyric: lyricApi,
		audio: audioApi,
		system: {
			// 配置目录
			configdir: dirs.configdir,
			// home目录
			homedir: dirs.homedir,
		},
		path,
		window: {
			createWindow,
			/**
			 * 退出并返回数据给创建者
			 * @param data 退出的数据
			 */
			exitWindow(data: any) {
				electron.ipcRenderer.sendSync('window.exit', data)
			},
			/**
			 * 关闭窗口
			 */
			closeWindow(data?: any) {
				electron.ipcRenderer.sendSync('window.close', windowId, data)
			},
			/** 当前窗口状态 */
			getState() {
				return electron.ipcRenderer.sendSync('window.state')
			},
			/** 全屏 */
			fullscreen(fullscreen: boolean) {
				electron.ipcRenderer.sendSync('window.fullscreen', fullscreen)
			},
			/** 最大化 */
			maximize(maximized: boolean) {
				electron.ipcRenderer.sendSync('window.maximize', maximized)
			},
			/** 最小化 */
			minimize() {
				electron.ipcRenderer.sendSync('window.minimize')
			},
			/** 显示、隐藏 */
			show(show: boolean) {
				electron.ipcRenderer.sendSync('window.show', show)
			},
		},
	}

	//初始化一下目录
	if (!fs.existsSync(nativeApi.system.configdir)) fs.mkdirSync(nativeApi.system.configdir, { recursive: true })

	electron.contextBridge.exposeInMainWorld('nativeApi', nativeApi)

	if (env?.loadScript) eval(env.loadScript)
}

electron.ipcRenderer.on('theme.changed', (evt, _theme) => updateTheme(_theme))

window.addEventListener('load', () => main())
