import zlib from 'zlib'

export type TLyricType = 'krc'


export class SimpleLyric {
	//行信息
	#lines: Array<{
		start: number				//开始时间
		words: Array<{				//字列表
			time: number			//持续时间
			word: string			//字
		}>
	}> = []
	#ti?: string
	#ar?: string

	public set(key: 'ti' | 'ar', val: string) {
		if (key == 'ti') this.#ti = val
		else if (key == 'ar') this.#ar = val
	}


	//放入行
	public put(start: number, words: Array<{ time: number, word: string }>) {
		this.#lines.push({ start, words })
	}

	public toString() {
		const obj = {
			ar: this.#ar ?? undefined,
			ti: this.#ti ?? undefined,
			lines: this.#lines,
		}
		return JSON.stringify(obj)
	}

}

export class LyricParser {
	//'@Gaw^2tGQ61-ÎÒni'
	private static KRC_ENCODE_KEY = Buffer.from(new Uint8Array([64, 71, 97, 119, 94, 50, 116, 71, 81, 54, 49, 45, 206, 210, 110, 105]))

	/**
	 * 根据base64字符串创建歌词解析器
	 * @param type 歌词类型
	 * @param b64 base64字符串
	 */
	public static fromBase64(type: TLyricType, b64: string) {
		return new this(type, Buffer.from(b64, 'base64'))
	}

	#lyric!: string

	private constructor(type: TLyricType, buffer: Buffer) {
		if (type == 'krc') this.#decodeKrc(buffer)
	}

	#decodeKrc(buffer: Buffer) {
		const docoded = Buffer.alloc(buffer.length - 4)
		const KRC_ENCODE_KEY = LyricParser.KRC_ENCODE_KEY
		//解码
		for (let i = 4; i < buffer.length; i++) {
			docoded[i - 4] = buffer[i] ^ KRC_ENCODE_KEY[(i - 4) % 16]
		}
		//解压
		const str = zlib.unzipSync(docoded) + ''
		// console.log(str)
		//解析
		const lines = str.split(/\r?\n/g).map(s => s.trim()).filter(s => !!s)
		const lyric = new SimpleLyric()
		lines.forEach(line => {
			if (!line) return
			let match = line.match(/^\[\s*(\d+)\s*,\s*(\d+)\s*\]\s*([\s\S]+)\s*$/)
			if (!match || !match[1] || !match[3]) {
				match = line.match(/^\[\s*(ar|ti)\s*:\s*([\s\S]+?)\s*\]$/)
				if (!match || !match[1] || !match[2]) return
				lyric.set(match[1] as any, match[2])
				return
			}
			const start = parseInt(match[1])
			const words = match[3].match(/<\s*\d+\s*,\s*\d+\s*,\s*\d+\s*>\s*[^<>]+\s*/g)?.map(ch => {
				const mt = ch.match(/^<\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*>\s*([^<>]+)\s*$/)
				if (!mt) return null!
				return {
					time: parseInt(mt[2]),
					word: mt[4],
				}
			})?.filter(w => !!w)
			if (!words) return
			lyric.put(start, words)
		})

		this.#lyric = lyric.toString()
	}


	public get lyric() {
		return this.#lyric
	}

}