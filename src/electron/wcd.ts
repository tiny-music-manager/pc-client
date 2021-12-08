// WebContent Data
import electron from 'electron'

interface IWindowEnv {
	preload: string,
	loadScript?: string
	hideAlways?: boolean
}

interface IWCDItem {
	windowId: number
	creatorId: number | null
	env: IWindowEnv
}

type TWCDID = electron.BrowserWindow | electron.WebContents | number

//webcontent字典
const dict: { [i: number]: IWCDItem } = {}

function getWebContentId(e: TWCDID) {
	if (typeof e == 'number') return e
	else if (e instanceof electron.BrowserWindow) return e.webContents.id
	else if (e.id) return e.id
	return -1
}

export const wcd = {
	get(e: TWCDID | undefined): IWCDItem | null {
		if (!e) return null
		return dict[getWebContentId(e)] ?? null
	},
	set(e: TWCDID | undefined, val: IWCDItem) {
		if (!e) return
		const id = getWebContentId(e)
		if (id < 0) return
		dict[id] = val
	}
}