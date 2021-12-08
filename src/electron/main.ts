import path from 'path'
import fs from 'fs'
import electron from 'electron'
import { createDesktopLyric } from './dlyric'
import { wcd } from './wcd'
import { configDir } from './consts'
import { discover } from './discover'
import { serveWeb } from './static'
import { createTray } from './tray'

let dlyric: ReturnType<typeof createDesktopLyric>
let tray: ReturnType<typeof createTray>
const devmode = false
const production = path.extname(__filename) == '.js'

//获取主题
function getTheme() {
	const confFile = path.join(configDir, 'system.json')
	const conf = (() => {
		if (!fs.existsSync(confFile)) return null
		try {
			return JSON.parse(fs.readFileSync(confFile) + '')
		} catch (err) {
			return null
		}
	})()

	//主题
	const theme = ['light', 'dark'].includes(conf?.theme) ? conf?.theme : (electron.nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
	//颜色
	const color = conf?.color ?? 'green'
	//字体
	const font = conf?.font ?? ''

	return { theme, color, font }
}

//从WebContents获取窗口对象
function windowFromWC(wc: electron.WebContents): electron.BrowserWindow | null {
	return electron.BrowserWindow.getAllWindows().filter(win => win.webContents.id == wc.id)?.[0] ?? null
}

//通知所有窗口改变主题
function changeTheme() {
	electron.BrowserWindow.getAllWindows().forEach(window => window.webContents.send('theme.changed', getTheme()))
}

//初始化消息管理
function initialMessage() {

	//创建窗口
	electron.ipcMain.on('window.create', (evt, option: electron.BrowserWindowConstructorOptions & { env: IWindowEnv }) => {
		const { env = {}, ...rest } = option
		const win = new electron.BrowserWindow({
			icon: path.join(electron.app.getAppPath(), 'res/logo/logo.png'),
			...rest,
			show: false,
			parent: rest.modal ? windowFromWC(evt.sender) ?? undefined : undefined,
			webPreferences: {
				...rest?.webPreferences ?? {},
				nodeIntegration: true,
				contextIsolation: true,
				webSecurity: false,
				scrollBounce: true,
				preload: path.join(electron.app.getAppPath(), 'preload.js'),
			},
		})
		wcd.set(win, {
			windowId: win.id,
			env: { ...env, preload: 'main' },
			creatorId: evt.sender.id,
		})
		const id = win.id
		win.on('closed', () => evt.sender.postMessage('window.closed', { id }))
		win.webContents.send('theme.changed', getTheme())
		evt.returnValue = win.id
	})
	//关闭窗口
	electron.ipcMain.on('window.openFile', async (evt, id, filepath) => {
		const win = electron.BrowserWindow.fromId(id)
		if (win) win.loadFile(path.resolve(electron.app.getAppPath(), filepath))
		evt.returnValue = undefined
	})
	//关闭窗口
	electron.ipcMain.on('window.openURL', (evt, id, url) => {
		const win = electron.BrowserWindow.fromId(id)
		if (win) win.loadURL(url)
		evt.returnValue = undefined
	})
	//关闭窗口
	electron.ipcMain.on('window.close', (evt, id: number, data?: any) => {
		const win = electron.BrowserWindow.fromId(id)
		if (win) {
			if (data !== undefined) {
				const { creatorId } = wcd.get(win) ?? {}
				if (creatorId) {
					electron.webContents.fromId(creatorId).postMessage('window.exit', { id, data })
				}
				setTimeout(() => win.close(), 100);
			}
			else {
				win.close()
			}
		}
		evt.returnValue = undefined
	})
	//退出
	electron.ipcMain.on('window.exit', (evt, data) => {
		const wcItem = wcd.get(evt.sender)
		if (wcItem?.creatorId) {
			const creator = electron.webContents.fromId(wcItem.creatorId)
			if (creator) {
				creator.postMessage('window.exit', { id: wcItem.windowId, data })
			}
		}
		evt.returnValue = undefined
	})
	//获取环境
	electron.ipcMain.on('window.env', (evt, data) => {
		evt.returnValue = wcd.get(evt.sender)?.env
	})
	//当前窗口id
	electron.ipcMain.on('window.id', (evt) => {
		evt.returnValue = windowFromWC(evt.sender)?.id
	})
	//全屏
	electron.ipcMain.on('window.fullscreen', (evt, fullscreen) => {
		windowFromWC(evt.sender)?.setFullScreen(fullscreen)
		evt.returnValue = undefined
	})
	//最大化
	electron.ipcMain.on('window.maximize', (evt, maximized) => {
		if (maximized) windowFromWC(evt.sender)?.maximize()
		else windowFromWC(evt.sender)?.unmaximize()
		evt.returnValue = undefined
	})
	//最小化
	electron.ipcMain.on('window.minimize', (evt) => {
		windowFromWC(evt.sender)?.minimize()
		evt.returnValue = undefined
	})
	//显示隐藏
	electron.ipcMain.on('window.show', (evt, show) => {
		if (show) windowFromWC(evt.sender)?.show()
		else windowFromWC(evt.sender)?.hide()
		evt.returnValue = undefined
	})
	//当前窗口状态
	electron.ipcMain.on('window.state', (evt) => {
		const win = windowFromWC(evt.sender)
		evt.returnValue = win ? {
			maximized: win.isMaximized(),
			minimized: win.isMinimized(),
			fullscreen: win.isFullScreen(),
			normal: win.isNormal(),
		} : null
	})
	//获取主题
	electron.ipcMain.on('theme.current', (evt) => {
		evt.returnValue = getTheme()
	})
	//应用数据变更
	electron.ipcMain.on('appdata.update', (evt, type) => {
		electron.BrowserWindow.getAllWindows().forEach(window => window.webContents.send('appdata.update', type))
		//如果是系统配置，更新主题及颜色
		changeTheme()
		evt.returnValue = undefined
	})
	//获取相关的点（主要用于在桌面歌词中处理鼠标穿透问题，由于Linux不支持，只有这样了）
	electron.ipcMain.on('points', (evt, type) => {
		const p = electron.screen.getCursorScreenPoint()
		const win = electron.BrowserWindow.getAllWindows().filter(win => win.webContents.id == evt.sender.id)[0]
		const r = win.getBounds()
		evt.returnValue = {
			mouse: { x: p.x, y: p.y },
			window: { x: r.x, y: r.y, w: r.width, h: r.height },
		}
	})
	//桌面歌词配置
	electron.ipcMain.on('dlyric.config', (evt, data) => {
		dlyric.config(data.type, data.data)
		evt.returnValue = undefined
	})
	//桌面歌词鼠标事件忽略设置
	electron.ipcMain.on('dlyric.ignoreMouse', (evt, ignore) => {
		dlyric.ignoreMouseEvent(!!ignore)
		evt.returnValue = undefined
	})
	//桌面歌词显示、隐藏
	electron.ipcMain.on('dlyric.show', (evt, show) => {
		dlyric.show(!!show)
		evt.returnValue = undefined
	})
	//桌面歌词是否显示
	electron.ipcMain.on('dlyric.showing', (evt) => {
		evt.returnValue = dlyric.showing
	})
	//托盘图标设置
	electron.ipcMain.on('tray.config', (evt, data) => {
		tray.config(data.key, data.value)
		evt.returnValue = undefined
	})
	//获取Web服务器静态资源地址
	electron.ipcMain.on('webserver.static', (evt, show) => {
		evt.returnValue = serveWeb.address
	})
}

//入口
electron.app.whenReady().then(async () => {
	//去除菜单
	electron.app.applicationMenu = null

	//单实例
	if (!electron.app.requestSingleInstanceLock()) {
		console.log('requestSingleInstanceLock = true')
		return electron.app.quit()
	}

	//处理消息
	initialMessage()

	//创建web服务器
	if (production) await serveWeb()

	//先发现网络
	await discover()

	//主题变动消息
	electron.nativeTheme.on('updated', () => changeTheme())

	//创建窗口并加载内容
	const win = new electron.BrowserWindow({
		width: devmode ? 1800 : 1240,
		minWidth: 1045,
		height: 800,
		minHeight: 600,
		show: false,
		frame: false,
		fullscreenable: false,
		icon: path.join(electron.app.getAppPath(), 'res/logo/logo.png'),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: true,
			webSecurity: false,
			scrollBounce: true,
			preload: path.join(electron.app.getAppPath(), 'preload.js'),
		},
	})
	wcd.set(win, {
		windowId: win.id,
		creatorId: null,
		env: { preload: 'main' },
	})
	if (devmode) win.webContents.openDevTools()
	changeTheme()
	win.loadURL(`${serveWeb.address}/recommend`)
	win.once('closed', () => electron.app.quit())

	//单实例处理
	electron.app.on('second-instance', () => win.show())

	//桌面歌词
	dlyric = createDesktopLyric()

	//托盘图标
	tray = createTray(win)
})

