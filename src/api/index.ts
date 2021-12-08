import { consts } from "../libs/consts"
import { IUConfig } from "../libs/datatype"

type TFile = string | { filename: string, content: string | Buffer | ArrayBuffer | Blob, type?: string }

type TApiFuncRet<T, F> = F extends undefined ? [params: T] : [params: T, files: F]

function apidef<T = any, F = undefined>(pathname: string, method: 'get' | 'post' | 'put' | 'delete') {
	return (async (params: any, files: any) => {
		//生成body
		const body = () => {
			//get方式
			if (method == 'get') return { params: { body: JSON.stringify(params) } }
			//有文件则使用formdata
			if (files) {
				const fd = nativeApi.request.formdata()
				if (params) fd.append('body', JSON.stringify(params))
				Object.keys(files).forEach(k => {
					const v = (files as any)[k]
					if (!v) return
					if (v instanceof Array) v.forEach(vi => {
						vi && fd.appendFile(`k[]`, vi)
					})
					fd.appendFile(k, v)
				})
				return { body: fd.done() }
			}
			//其他正常使用json
			return { body: nativeApi.request.json(params) }
		}

		console.log(`[${method}] ${pathname}`)

		const res = await nativeApi.request[method](`${consts.apiURL}${pathname}`, {
			type: 'json5',
			timeout: 2000,
			...body(),
			headers: {
				authorization: nativeApi.appdata.getUserToken() ?? '',
			}
		})

		if (res.status == 500) {
			throw new Error(res.message)
		}
		else if (res.status == 404) {
			throw new Error('not found')
		}

		return res

	}) as (...args: TApiFuncRet<T, F>) => Promise<any>
}

export const apis = {
	common: {
		recommend: apidef<{}>('/api/common/recommend', 'get'),		//每日推荐
	},
	album: {
		list: apidef<{ ids?: Array<string>, names?: Array<string> }>('/api/album/list', 'get'),
		filter: apidef<{ pych?: string, page?: number, limit?: number }>('/api/album/filter', 'get'),
		search: apidef<{ keyword: string }>('/api/album/search', 'get'),
		save: apidef<{ id?: string, name: string, issue?: string, artists: Array<string>, desc?: string }, { pic?: TFile }>('/api/album/save', 'post'),
		remove: apidef<{ id: string }>('/api/album/remove', 'post'),
	},
	artist: {
		list: apidef<{ ids?: Array<string>, names?: Array<string> }>('/api/artist/list', 'get'),
		filter: apidef<{ pych?: string, page?: number, limit?: number }>('/api/artist/filter', 'get'),
		search: apidef<{ keyword: string }>('/api/artist/search', 'get'),
		save: apidef<{ id?: string, name: string, fname?: string, birthday?: string, desc?: string }, { avatar?: TFile }>('/api/artist/save', 'post'),
		remove: apidef<{ id: string }>('/api/artist/remove', 'post'),
	},
	kind: {
		list: apidef<{ id?: string, musicPage?: number, musicLimit?: number }>('/api/kind/list', 'get'),
		save: apidef<{ id?: string, name: string, type: string, desc: string }>('/api/kind/save', 'post'),
		remove: apidef<{ id: string }>('/api/kind/remove', 'post'),
	},
	music: {
		upload: apidef<{
			name: string
			artists: Array<{ id?: string, name: string, birthday?: string, desc?: string, avatar?: string }>
			album?: {
				id?: string
				name: string
				issue?: string
				desc?: string
				pic?: string
				artists: Array<{ id?: string, name: string, birthday?: string, desc?: string, avatar?: string }>
			}
			types: Array<string>
			pic?: string
		}, { music: TFile }>('/api/music/upload', 'post'),
		search: apidef<{ keyword: string }>('/api/music/search', 'get'),
		validate: apidef<{ name: string, artists: Array<string>, duration: number }>('/api/music/validate', 'get'),
		save: apidef<{ id: string, name: string, artists: Array<string>, albums: Array<string>, types: Array<string> }, { image?: TFile }>('/api/music/save', 'post'),
		remove: apidef<{ id: string }>('/api/music/remove', 'post'),
		info: apidef<{ id: string }>('/api/music/info', 'get'),
	},
	lyric: {
		save: apidef<{ id?: string, music: string, name: string, artist: string, album: string, duration: number, body: Array<[number, string | Array<[number, string]>]>, oid?: string }>('/api/lyric/save', 'post'),
		list: apidef<{ music: string }>('/api/lyric/list', 'get'),
		remove: apidef<{ id: string }>('/api/lyric/remove', 'post'),
		default: apidef<{ id: string }>('/api/lyric/default', 'post'),
	},
	user: {
		login: apidef<{ number: string, password: string }>('/api/user/login', 'post'),
		self: apidef<{}>('/api/user/self', 'get'),
	},
	love: {
		base: apidef<{}>('/api/love/base', 'get'),
		save: apidef<{ type: "music" | "album" | "artist", action: "add" | "del", id: string }>('/api/love/save', 'post'),
		list: apidef<{ type: "music" | "album" | "artist", page: number, limit: number }>('/api/love/list', 'get'),
	},
	playlist: {
		list: apidef<{}>('/api/playlist/list', 'get'),
		info: apidef<{ list: string }>('/api/playlist/info', 'get'),
		save: apidef<{ music: string, list: string, action: 'add' | 'del' }>('/api/playlist/save', 'post'),
		remove: apidef<{ list: string }>('/api/playlist/remove', 'post'),
	},
	sys: {
		initial: {
			list: apidef<{}>('/api/sys/initial', 'get'),
			save: apidef<{ number: string, name: string, password: string }>('/api/sys/initial/save', 'post'),
		},
		ping: apidef<{}>('/api/sys/ping', 'get'),
	},
	uconf: {
		get: apidef<{}>('/api/uconfig/get', 'get'),
		set: apidef<{ lyric: IUConfig['lyric'] }>('/api/uconfig/set', 'post'),
	},
	font: {
		list: apidef<{}>('/api/font/list', 'get'),
		save: apidef<{ id?: string, name: string }, { font?: TFile }>('/api/font/save', 'post'),
		remove: apidef<{ id: string }>('/api/font/remove', 'post'),
	},
}