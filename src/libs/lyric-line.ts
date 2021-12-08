//歌词行数据
export class LyricPlayLine {
	#start: number
	#end: number
	#next: number
	#items: Array<{ start: number, end: number, string: string }> = []
	#type: 'lyric' | 'karaoke'

	constructor(lines: Array<[number, string | Array<[number, string]>]>, index: number) {
		const [base, words] = lines[index]
		this.#start = base
		this.#next = lines[index + 1] ? lines[index + 1][0] : Number.MAX_SAFE_INTEGER

		//普通歌词
		if (typeof words == 'string') {
			this.#end = this.#next
			this.#items.push({ start: base, end: this.#end, string: words })
			this.#type = 'lyric'
		}
		//卡拉OK歌词
		else {
			let offset = 0
			words.forEach(w => {
				this.#items.push({ start: base + offset, end: base + offset + w[0], string: w[1] })
				offset += w[0]
			})
			this.#end = base + offset
			this.#type = 'karaoke'
		}
	}

	public get start() {
		return this.#start
	}

	public set start(val: number) {
		this.#start = val
	}

	public get end() {
		return this.#end
	}

	public get type() {
		return this.#type
	}

	public get items() {
		return this.#items
	}

	public isPlayed(current: number) {
		return current > this.#end
	}

	public isPlaying(current: number) {
		return current >= this.#start && current < this.#end
	}

	public isCurrent(current: number) {
		return current >= this.#start && current < this.#next
	}

	//文字是否正在播放，如果正在播放返回百分比，否则返回-1
	public wordPlaying(index: number, current: number) {
		const w = this.#items[index]
		if (current >= w.start && current < w.end) {
			return (current - w.start) * 100 / (w.end - w.start)
		}
		return -1
	}

	public wordPlayed(index: number, current: number) {
		const w = this.#items[index]
		return current > w.end
	}
}