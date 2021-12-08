export interface IKind {
	id: string
	name: string
	type: string
	desc: string
	//详情特有
	musicResult: { count: number, limit: number, musics: Array<IMusic> }
}

export interface IArtist {
	id: string
	name: string
	fname: string
	birthday: string
	avatar: string
	desc: string
	counts: { musics: number, albums: number }
	//详情页特有
	musics?: Array<IMusic>											//歌曲
	albums?: Array<{ id: string, name: string, pic: string }>		//其他专辑
}

export interface IAlbum {
	id: string
	name: string
	issue: string
	artists: Array<{
		id: string
		name: string
		avatar: string
	}>
	desc: string
	pic: string
	counts: { musics: number }
	//详情页特有的
	musics?: Array<IMusic>												//歌曲列表
	others?: Array<{ id: string, name: string, pic: string }>			//其他专辑
}

export interface IMusic {
	id: string
	name: string
	types: Array<string>
	hash: string
	duration: number
	bitrate: { rate: number, unit: string } | null
	image: string
	time: string
	file: string
	artists: Array<{
		id: string
		name: string
		fname: string
		birthday: string
		avatar: string
	}>
	albums: Array<{
		id: string
		name: string
		issue: string
		pic: string
	}>
}

export interface ILyric {
	id: string
	name: string
	artist: string
	album: string
	type: 'karaoke' | 'lyric'
	text: string
	duration: number
	default: boolean
	oid: string
	lyric: string
}

export interface IUser {
	id: string
	number: string
	name: string
	email: string
	avatar: string
	admin: boolean
}

export interface IFont {
	id: string
	name: string
	file: string
}

export interface IUConfig {
	id: string
	lyric: {
		align: 'center' | 'left-right' | 'single-line'
		color: { [K in 'play' | 'wait']: [string, string] }
		font: { id: string, size: number, bold: boolean }
	}
}