import { TMMAudio } from "./audio"
import { consts } from "./consts"
import { IMusic } from "./datatype"

export interface IPlayListMusic {
	id: string,
	name: string
	image: string,
	file: string
	artists: Array<{
		id: string
		name: string
		avatar: string
	}>
	albums: Array<{
		id: string
		name: string
		pic: string
	}>
}

export type TPlayMethod = 'list' | 'single' | 'random'

export const player = (function () {

	const audio = new TMMAudio()
	let playList: Array<IPlayListMusic> = []
	let current: number = 0
	let currentSrc: string

	let method: TPlayMethod = 'list'
	let loop = true
	let initialing = true

	//检测是否可以初始化
	const timer = setInterval(() => {
		if (typeof nativeApi == 'undefined') return
		clearInterval(timer)
		//初始化默认数据
		const config = nativeApi.appdata.getPlayerConfig()
		player.playList = config.list ?? []
		player.current = config.current
		method = config.method as TPlayMethod
		audio.volume = config.volume
		initialing = false
		//初始化托盘
		nativeApi.tray.config('method', player.method)
		nativeApi.tray.on('control', (name: string) => {
			if (name == 'prev') player.prev()
			else if (name == 'next') player.next()
			else if (name == 'playpause') player.playPause()
		})
		nativeApi.tray.on('method', (method: any) => {
			player.method = method
		})
	}, 10);

	let onupdate: (() => any) | null = null
	let onstatechange: (() => any) | null = null

	//数据发生变化
	function handleDataChanged() {
		if (!initialing) nativeApi.appdata.setPlayerConfig({ volume: audio.volume, method, current, list: playList })
	}

	//控制发生变化
	function handleControlChanged() {
		if (!initialing) nativeApi.appdata.setPlayerConfig({ volume: audio.volume, method, current, list: playList })
	}

	//设置定时器一直触发事件，差不多保持24帧的样子
	let updating = false
	setInterval(async () => {
		if (!audio.playing || updating) return
		await playEvtCB()
	}, 1000 / 24)

	//用于触发update事件
	const playEvtCB = async () => {
		if (updating) return
		updating = true
		await onupdate?.()
		updating = false
	}

	//自动处理下一曲
	const autoNext = () => {
		if (!playList.length) return
		//随机播放
		if (method == 'random') {
			const index = parseInt(Math.random() * playList.length as any)
			player.play(index)
		}
		//单曲
		else if (method == 'single') {
			if (loop) player.play(current)
		}
		//列表
		else if (method == 'list') {
			let index = ++current
			//最后一首
			if (index > playList.length - 1) {
				//不循环就算了
				if (!loop) return
				//回到第一首
				index = 0
			}
			player.play(index)
		}
	}

	//音乐事件
	audio.onplay = () => {
		onstatechange?.()
		playEvtCB()
	}
	audio.onpause = () => {
		onstatechange?.()
		if (audio.currentTime >= audio.duration - 1) autoNext()		//歌曲播放结束
		playEvtCB()
	}
	audio.onwaiting = playEvtCB
	audio.onloadeddata = playEvtCB
	audio.onloadedmetadata = playEvtCB
	audio.ondurationchange = playEvtCB

	const musicurl = (music: IPlayListMusic) => `${consts.apiURL}/${music.file}`

	//播放器
	const player = {
		/** 设置播放列表 */
		set playList(list: Array<IMusic | IPlayListMusic>) {
			if (!list?.length) return
			playList = list.map(li => ({
				id: li.id, name: li.name, image: li.image, file: li.file,
				artists: li.artists.map(ar => ({ id: ar.id, name: ar.name, avatar: ar.avatar })),
				albums: li.albums.map(ab => ({ id: ab.id, name: ab.name, pic: ab.pic }))
			}))

			if (!audio.src && playList.length) {
				audio.src = musicurl(playList[0])
				current = 0
			}
			playEvtCB()
			handleDataChanged()
		},

		/** 获取播放列表 */
		get playList(): Array<IPlayListMusic> {
			return playList
		},

		/** 设置当前播放序号或ID */
		set current(id: number | string) {
			if (id !== undefined && id !== null) {
				//ID查询
				if (typeof id == 'string') {
					for (let i = 0; i < playList.length; ++i) {
						if (playList[i].id == id) {
							current = i
							break
						}
					}
				}
				//标号
				else if (typeof id == 'number') {
					if (playList[id]) current = id
				}
				//没有歌曲
				if (!playList[current]) return
				//src检测
				const src = musicurl(playList[current])
				if (currentSrc != src) {
					currentSrc = src
					//播放
					audio.src = currentSrc
				}
			}
		},

		/**
		 * 播放ID
		 * @param id 音乐ID或列表序号
		 */
		play(id?: string | number) {
			if (id !== undefined) this.current = id
			audio.play()
			handleControlChanged()
			nativeApi.tray.config('music', this.music?.name ?? '')
		},

		/** 是否正在播放 */
		get playing() {
			return audio.playing
		},

		/** 暂停 */
		pause() {
			if (!audio.playing) return
			audio.pause()
		},

		/** 自动播放暂停 */
		playPause() {
			audio.playPause()
		},

		/** 设置播放时间 */
		set time(time: number) {
			if (!isFinite(time) || isNaN(time)) return
			audio.currentTime = time
		},

		/** 获取播放时间 */
		get time() {
			return audio.currentTime
		},

		/** 获取总时长 */
		get duration() {
			return audio.duration
		},

		/** 获取进度百分比 */
		get percent() {
			return audio.percent
		},

		/** 获取播放方式 */
		get method() {
			return method
		},

		/** 设置播放方式 */
		set method(m) {
			method = m
			handleControlChanged()
			nativeApi.tray.config('method', m)
		},

		/** 获取循环方式 */
		get loop() {
			return loop
		},

		/** 设置循环方式 */
		set loop(l) {
			loop = l
			handleControlChanged()
		},

		/** 获取音量 */
		get volum() {
			return audio.volume
		},

		/** 设置音量 */
		set volum(v) {
			if (!isFinite(v) || isNaN(v)) return
			audio.volume = v
			handleControlChanged()
		},

		/** 当前播放的音乐 */
		get music(): IPlayListMusic | null {
			return playList[current] ?? null
		},

		/** 获取播放速度 */
		get playbackRate() {
			return audio.playbackRate
		},

		/** 设置播放速度 */
		set playbackRate(rate) {
			audio.playbackRate = rate
		},

		/**
		 * 获取最后的缓冲时间
		 */
		get buffered() {
			if (!audio.buffered.length) return 0
			return audio.buffered.end(audio.buffered.length - 1)
		},

		/** 下一曲 */
		next() {
			let index = current + 1
			if (index > playList.length - 1) index = 0
			this.play(index)
		},

		/** 上一曲 */
		prev() {
			let index = current - 1
			if (index < 0) index = playList.length - 1
			this.play(index)
		},

		/** 播放器发生更新调用 */
		set onupdate(cb: () => any) {
			onupdate = cb
		},

		/** 播放器发生更新调用 */
		set onstatechange(cb: () => any) {
			onstatechange = cb
		}
	}

	return player
})()

	;
(window as any).player = player