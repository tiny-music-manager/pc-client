import { apis } from "../api"
import { IUser } from "./datatype"

type TData = 'love' | 'playlist' | 'user'

const listeners: { [K in TData]?: Array<() => any> } = {}
const keyvalues: { [K in TData]?: any } = {}

function fire(name: TData) {
	listeners[name]?.forEach(func => func())
}

function getValue(name: TData) {
	return keyvalues[name] ?? null
}

function setValue(name: TData, value: any) {
	keyvalues[name] = value
	fire(name)
}

type TLove = { albums: Array<string>, artists: Array<string>, musics: Array<string> }
type TPlayList = { id: string, name: string }

export const dataset = {
	on(name: TData, callback: () => any) {
		if (!listeners[name]) listeners[name] = []
		listeners[name]?.push(callback)
	},

	set love(data: TLove) {
		setValue('love', data)
	},

	get love() {
		const love = getValue('love')
		return {
			albums: love?.albums ?? [],
			artists: love?.artists ?? [],
			musics: love?.musics ?? [],
		}
	},

	set playlists(lists: Array<TPlayList>) {
		setValue('playlist', lists)
	},

	get playlists() {
		return getValue('playlist') ?? []
	},

	set user(user) {
		setValue('user', user)
	},

	get user(): IUser | null {
		return getValue('user') ?? null
	},

}


	;
(window as any).dataset = dataset