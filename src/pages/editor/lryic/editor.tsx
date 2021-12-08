import './editor.scss'
import { ILyric, IMusic } from '../../../libs/datatype'
import { Dialog } from '../../../libs/dialog'
import { AppbarButtons } from '../../../components/appbar/btns'
import { Tab } from '../../../components/tab'
import { apis } from '../../../api'
import { consts } from '../../../libs/consts'
import React from 'react'
import { TMMAudio } from '../../../libs/audio'
import { Image } from '../../../components/image/image'
import { createDialog } from '../../../components/popover'
import { LyricPlayLine } from '../../../libs/lyric-line'

//中日韩文字相关正则表达式(把空格和英文标点符号也算在内)
const cjkReg = /^[\u2E80-\u9FBF\u0020-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u007e]+$/

interface ILyricInfo {
	ti: string
	ar: string
	al: string
	body: Array<[number, string | Array<[number, string]>]>
}

interface ILyricEditorState {
	tab: string
	lyricText: string
	tuningText: string
}

interface ILyricEditorData {
	lyric: ILyric | undefined
	music: string
}

interface ILyricEditorResult extends Boolean { }




class LyricSaveBody extends React.Component<{ info: { ti: string, ar: string, al: string } }> {

	render() {
		const { info } = this.props

		const props = (name: keyof typeof info) => {
			return {
				value: info[name],
				onChange: (e: any) => {
					info[name] = e.target.value
					this.forceUpdate()
				}
			}
		}

		return (
			<div className="lyric-save-body">
				<div>
					<div>名称</div>
					<input type="text" className="input" {...props('ti')} />
				</div>
				<div>
					<div>歌手</div>
					<input type="text" className="input" {...props('ar')} />
				</div>
				<div>
					<div>专辑</div>
					<input type="text" className="input" {...props('al')} />
				</div>
			</div>
		)
	}
}


export class LyricEditor extends Dialog<ILyricEditorData, ILyricEditorResult, {}, ILyricEditorState> {
	public static config = { name: 'lyric-editor', width: 1000, height: 620 }

	private lyricId?: string		//歌词ID，如果是添加的，添加后设置为添加的歌词的ID
	private updated = false			//服务器端歌词是否被更新

	private audio = new TMMAudio()				//播放器

	private lyricInfo!: ILyricInfo								//歌词信息
	private music!: IMusic										//歌曲信息
	private lines!: Array<LyricPlayLine>						//歌词行信息(用于预览时显示)
	private lineWords?: Array<Array<string>>					//分词结果
	private makeState = { line: 0, word: 0, done: false }		//歌词制作状态，当前只做到第几行的第几个字，以及是否制作完成
	private lineTime: Array<[number, Array<number>]> = []		//歌词制作结果

	private makeBody = React.createRef<HTMLDivElement>()		//歌词制作（用于自动滚动定位）
	private previewBody = React.createRef<HTMLDivElement>()		//预览（用于自动滚动定位）

	private progressDownAt: { x: number, playTime: number, resume: boolean, cwidth: number } | null = null		//播放器进度控制

	constructor(props: any) {
		super(props)
		//初始化歌词信息
		if (this.data.lyric) this.lyricInfo = nativeApi.lyric.parseLyric(this.data.lyric.lyric)
		else this.lyricInfo = { ti: '', ar: '', al: '', body: [] }
		this.initLines(this.lyricInfo.body)
		this.initMakeState()
		if (this.lyricInfo.body.length) this.makeState.done = true
		this.lyricId = this.data.lyric?.id
		//状态
		this.state = { tab: this.makeState.done ? 'preview' : 'edit', lyricText: this.lyricEditText, tuningText: this.lyricTuningText }

		this.handleLyricMakeKeyDown = this.handleLyricMakeKeyDown.bind(this)
		this.handleMouseMove = this.handleMouseMove.bind(this)
		this.handleMouseUp = this.handleMouseUp.bind(this)
	}

	async componentDidMount() {
		this.music = await apis.music.info({ id: this.data.music })
		this.audio.src = `${consts.apiURL}/${this.music.file}`
		this.audio.onplay = this.audio.onpause = () => this.forceUpdate()
		window.addEventListener('mousemove', this.handleMouseMove)
		window.addEventListener('mouseup', this.handleMouseUp)

		this.initLyricPlay()

		window.addEventListener('keydown', this.handleLyricMakeKeyDown)
		this.forceUpdate()
	}

	componentWillUnmount() {
		this.audio.pause()
		window.removeEventListener('keydown', this.handleLyricMakeKeyDown)
		window.removeEventListener('mousemove', this.handleMouseMove)
		window.removeEventListener('mouseup', this.handleMouseUp)
	}

	//歌曲进度拖动
	private handleProgressDown(e: MouseEvent) {
		this.progressDownAt = {
			x: e.clientX, playTime: this.audio.currentTime, resume: this.audio.playing,
			cwidth: (e.target as HTMLDivElement).parentElement?.parentElement?.clientWidth!,
		}
		this.audio.pause()
	}

	//鼠标移动
	private handleMouseMove(e: MouseEvent) {
		if (this.progressDownAt) {
			let time = this.progressDownAt.playTime + this.audio.duration * (e.clientX - this.progressDownAt.x) / this.progressDownAt.cwidth
			if (time < 0) time = 0
			if (time > this.audio.duration) time = this.audio.duration
			this.audio.currentTime = time
		}
	}

	//鼠标松开
	private handleMouseUp(e: MouseEvent) {
		if (this.progressDownAt) {
			console.log(this.progressDownAt.resume)
			if (this.progressDownAt.resume) this.audio.play()
			this.progressDownAt = null
		}
	}

	//初始化歌词播放信息
	private initLyricPlay() {
		let childIndex = 0
		setInterval(() => {
			if (this.state.tab == 'preview') this.forceUpdate(() => {
				//找到滚动元素
				if (!this.previewBody.current) return
				const main = this.previewBody.current
				let dom!: HTMLDivElement
				for (let i = 0; i < main.children.length; ++i) {
					if ((main.children[i] as HTMLDivElement).classList.contains('lyric-current')) {
						if (childIndex == i) return
						childIndex = i
						dom = main.children[i] as HTMLDivElement
						break
					}
				}
				if (!dom) return
				//滚动
				const top = (dom.offsetTop - (main.children[0] as HTMLDivElement).offsetTop) - (main.clientHeight / 2) + dom.clientHeight
				if (top < 0) return
				main.scrollTop = top
			})
			else if (this.state.tab == 'make') this.forceUpdate()
		}, 50)
	}

	//歌词制作完成
	private async handleLyricMakeSuccess() {
		//停止歌曲，设置相关状态
		this.makeState.done = true
		this.audio.pause()
		this.audio.currentTime = 0
		//初始化行数据
		this.initLines((this.lineWords ?? []).map((line, i) => {
			const timeLine = this.lineTime[i]
			return [timeLine[0], line.map((str, j) => {
				const dur = timeLine[1][j + 1] - timeLine[1][j]
				return [dur, str]
			})]
		}))
		this.setState({ tuningText: this.lyricTuningText })
		//提示跳转
		if (!await createDialog('制作完成', '歌词制作完成，点击确定前往预览界面').wait()) return
		this.setState({ tab: 'preview' })
		this.audio.play()
	}

	//处理按键
	handleLyricMakeKeyDown(e: KeyboardEvent) {
		if (!this.makeBody.current) return
		const time = parseInt(this.audio.currentTime * 1000 as any)

		const scroll = () => this.forceUpdate(() => {
			//必要的校验
			if (!this.makeBody.current) return
			const body = this.makeBody.current
			const item = body.children[this.makeState.line] as HTMLDivElement
			if (!item) return
			//滚动
			body.scrollTop = item.offsetTop - (body.clientHeight * 2 / 3)
		})

		//回车
		if (e.code == 'Enter') {
			if (this.makeState.done || this.makeState.line >= this.lineTime.length) return
			let tline = this.lineTime[this.makeState.line]
			if (this.makeState.word >= tline[1].length - 1) {
				tline[1][this.makeState.word] = time
				this.makeState.word = 0
				this.makeState.line++
				//检测是否结束
				if (this.makeState.line >= this.lineTime.length) return this.handleLyricMakeSuccess()
				scroll()
			}
		}
		//空格
		else if (e.code == 'Space') {
			if (this.makeState.done || this.makeState.line >= this.lineTime.length) return
			//没有播放，开始播放
			if (!this.audio.playing) return this.audio.play()
			//检测行是否结束
			let tline = this.lineTime[this.makeState.line]
			if (this.makeState.word >= tline[1].length - 1) {
				tline[1][this.makeState.word] = time
				this.makeState.word = 0
				this.makeState.line++
				//检测是否结束
				if (this.makeState.line >= this.lineTime.length) return this.handleLyricMakeSuccess()
				tline = this.lineTime[this.makeState.line]
			}
			//处理歌词时间
			if (!tline[0]) tline[0] = time
			tline[1][this.makeState.word] = time
			this.makeState.word++
			scroll()
		}
		//删除当前行
		else if (e.code == 'Backspace') {
			if (this.makeState.done || this.makeState.line <= 0) return
			this.makeState.word = 0
			let tline = this.lineTime[this.makeState.line]
			if (!tline[0]) {
				this.makeState.line--
				tline = this.lineTime[this.makeState.line]
			}
			tline[0] = 0
			tline[1].forEach((_, i) => tline[1][i] = 0)
			this.forceUpdate()
			this.audio.currentTime = (this.lineTime[this.makeState.line - 1]?.[0] ?? 0) / 1000
			scroll()
		}
	}

	//歌词编辑器文本
	private get lyricEditText() {
		return (this.lineWords ?? []).map(line => line.map(word => `[${word}]`).join('')).join('\n')
	}

	//歌词微调文本
	private get lyricTuningText() {
		if (!this.makeState.done) return '请先制作歌词'

		let comment = [
			'// 每行格式为： [开始时间, [[分词A持续时间， "分词A内容"], [分词B持续时间, "分词B内容"], ... ...]]',
			'// 所有时间均使用毫秒（1秒 = 1000毫秒）',
			'',
			'// 对于内容，需要注意：',
			'//    1. 歌词内容中不能有换行',
			'//    2. 歌词内容中，如果有"，则需要改成\\"',
			'//    3. 歌词内容中，如果有\\，则需要改成\\\\',
			'',
			'',
		].join('\n')
		return comment + this.lines.map(line => {
			return JSON.stringify([line.start, line.items.map(item => ([item.end - item.start, item.string]))])
		}).join('\n')
	}

	//初始化歌词行信息
	private initLines(data: Array<[number, string | Array<[number, string]>]>) {
		this.lines = data.map((line, n) => new LyricPlayLine(data, n))
		this.lineWords = this.lines.map(line => {
			if (line.type == 'lyric') return [line.items[0].string]
			return line.items.map(s => s.string)
		})
	}

	//初始化歌词制作状态
	private initMakeState() {
		this.makeState.line = this.makeState.word = 0
		this.lineTime = (this.lineWords ?? []).map(line => ([0, [...line.map(w => 0), 0]]))
	}

	//分词
	private async handleTransLyric() {
		const txt = (this.state.lyricText ?? '').trim()

		//分词
		this.lineWords = txt.split(/\r?\n/g).map(s => s.trim()).filter(s => !!s).map(line => {
			const words: Array<string> = []
			let buffer = ''
			let group = false		//是否处于[]中

			const saveBuffer = () => {
				if (!buffer.length) return
				//空格
				if (/^ +$/.test(buffer)) {
					if (words.length) words[words.length - 1] += ' '
				}
				else {
					words.push(buffer)
				}
				buffer = ''
			}

			for (let i = 0; i < line.length; ++i) {
				//转义字符
				if (line[i] == '\\' && ['[', ']', '\\'].includes(line[i + 1])) {
					buffer += line[i + 1]
					++i
					continue
				}
				//分组内的
				if (line[i] == '[') {
					saveBuffer()
					group = true
				}
				else if (line[i] == ']') {
					saveBuffer()
					group = false
				}
				else buffer += line[i]
				//不在分组中的，特别处理一下
				if (!group && buffer.length) {
					const isCJK = (s: string) => cjkReg.test(s)
					if ((isCJK(buffer)) || (!isCJK(buffer) && isCJK(line[i + 1]))) {
						saveBuffer()
					}
				}
			}
			saveBuffer()
			return words
		})

		this.initMakeState()
		//组合回填
		this.setState({ lyricText: this.lyricEditText })

		if (!await createDialog('分词完成', '分词完成，是否前往歌词制作界面制作歌词？').wait()) return

		this.setState({ tab: 'make' })
	}

	//微调点击
	private handleTuning() {
		if (!this.makeState.done) return
		let n = -1
		try {
			//处理结果 + 校验
			const res = (this.state.tuningText || '').split(/\r?\n/g).map((line, index) => {
				line = line.trim()
				if (!line || /^\s*\/\//.test(line)) return null!
				n = index
				const res = JSON.parse(line) as [number, Array<[number, string]>]
				if (typeof res[0] != 'number' || res[0] < 0) throw new Error('start time error')
				const items = res[1].map(item => {
					if (typeof item[0] != 'number' || item[0] < 0) throw new Error('duration error')
					if (typeof item[1] != 'string') throw new Error('lyric word error')
					item[1] = item[1].replace(/ +/g, ' ')
					return item
				}).filter(item => !!item[1])
				return [res[0], items] as [number, Array<[number, string]>]
			}).filter(s => !!s)
			//保存结果
			this.initLines(res)
			this.setState({ lyricText: this.lyricEditText })
		} catch (err) {
			alert(`无法解析歌词，第${n + 1}行存在错误`)
		}
	}

	//重新制作
	private async handleReMake() {
		if (!await createDialog('重新制作', '是否要重新制作吗？').wait()) return
		//播放器初始化
		if (this.audio.playing) this.audio.pause()
		this.audio.currentTime = 0
		//界面设置
		this.initMakeState()
		this.makeState.done = false
		this.setState({ tuningText: this.lyricTuningText })
	}

	//保存歌词
	private async handleSaveLyric() {

		const result = {
			ti: this.lyricInfo.ti || this.music.name,
			ar: this.lyricInfo.ar || this.music.artists.map(a => a.name).join('、'),
			al: this.lyricInfo.al || this.music.albums.map(a => a.name).join('、'),
		}
		if (!await createDialog('保存歌词信息', <LyricSaveBody info={result} />).wait()) return
		if (!result.ti.trim()) return

		const body = this.lines.map(line => {
			return [line.start, line.items.map(item => {
				return [item.end - item.start, item.string] as [number, string]
			})] as [number, Array<[number, string]>]
		})

		//保存，并存储一下ID
		let { id } = await apis.lyric.save({
			id: this.lyricId,
			music: this.data.music,
			name: result.ti,
			artist: result.ar,
			album: result.al,
			duration: this.data.lyric?.duration ?? (this.music.duration * 1000),
			body: body,
			oid: this.data.lyric?.oid,
		})
		if (id) this.lyricId = id
		this.updated = true

		if (!await createDialog('保存完毕', `歌词已保存完毕(ID:${id})，是否退出编辑器？`).wait()) return
		this.exit(this.updated)
	}

	render() {
		const { tab, lyricText, tuningText } = this.state

		const currentTime = this.audio.currentTime * 1000

		return (
			<div className="app-window" id="lyric-editor">
				<div className="appbar">
					<div className="title">歌词编辑器</div>
					<AppbarButtons btns={['close']} onBtnClick={(btn) => (btn == 'close') && this.exit(this.updated)} />
				</div>
				<div className="appbody">
					<div className="title">
						<Tab items={[
							{ key: 'edit', title: '分词' },
							{ key: 'make', title: '制作' },
							{ key: 'tuning', title: '微调' },
							{ key: 'preview', title: '预览' },
						]} current={tab} onChange={tab => this.setState({ tab })} />
						{/* 按钮列表 */}
						{tab == 'edit' && lyricText.trim() ? <div className="button" onClick={this.handleTransLyric.bind(this)}>分词</div> : null}
						{tab == 'make' && this.makeState.done ? <div className="button" onClick={this.handleReMake.bind(this)}>重新制作</div> : null}
						{tab == 'tuning' && this.makeState.done ? <div className="button" onClick={this.handleTuning.bind(this)}>应用微调</div> : null}
						{this.makeState.done ? <div className="button" onClick={this.handleSaveLyric.bind(this)}>完成制作并保存歌词</div> : null}
					</div>
					{tab == 'preview' ? <div className="body preview" ref={this.previewBody}>
						{this.makeState.done ? this.lines.map((line, N) => {
							const playing = line.isPlaying(currentTime)
							const played = line.isPlayed(currentTime)
							const isCurrentLine = line.isCurrent(currentTime)

							//普通歌词
							if (line.type == 'lyric') {
								//普通歌词 isCurrentLine 和 playing一样
								return <div
									className={`lyric-line ${isCurrentLine ? 'lyric-playing lyric-current' : ''} ${played ? 'lyric-played' : ''}`}
									key={`${N}_${line.start}`}>
									<div className="item">{line.items[0].string}</div>
								</div>
							}
							//卡拉OK歌词
							return <div
								className={`lyric-line ${isCurrentLine ? 'lyric-current' : ''} ${playing ? 'lyric-playing' : ''} ${played ? 'lyric-played' : ''}`}
								key={`${N}_${line.start}`}>{line.items.map((item, index) => {
									const wplaying = line.wordPlaying(index, currentTime)
									return <div className={`item ${(playing && line.wordPlayed(index, currentTime)) ? 'lyric-played' : ''}`} key={index}>
										{item.string}
										{(wplaying > 0) ? <div style={{ width: `${wplaying}%` }}>{item.string}</div> : null}
									</div>
								})}</div>
						}) : null}
					</div> : null}
					{tab == 'edit' ? <div className="body edit">
						<textarea
							className="input"
							value={lyricText}
							onChange={e => this.setState({ lyricText: e.target.value })}
							onKeyDown={e => {
								const input = e.target as HTMLInputElement
								const start = input.selectionStart!
								const end = input.selectionEnd!
								if (input && (e.key == '[' || e.key == ']') && start != end) {
									e.preventDefault()
									const v1 = input.value.substring(0, start)
									const v2 = input.value.substring(start, end)
									const v3 = input.value.substring(end)
									this.setState({ lyricText: `${v1}[${v2}]${v3}` }, () => input.setSelectionRange(start, end + 2))
								}
							}}
							placeholder="歌词按行粘贴在这里，然后点击右上角的分词按钮进行分词"
						/>
					</div> : null}
					{tab == 'make' ? <div className="body make" ref={this.makeBody}>
						{this.lineWords?.map((words, lindex) => <div key={`line_${lindex}`} className="lyric-line">
							{words.map((word, windex) => <div key={`word_${windex}`} className={`lyric-word ${(this.lineTime[lindex][1][windex] || this.makeState.done) ? 'done' : ''}`}>
								{word}
							</div>)}
						</div>)}
					</div> : null}
					{tab == 'tuning' ? <div className="body tuning">
						<textarea className="input" value={tuningText} onChange={e => this.setState({ tuningText: e.target.value })} />
					</div> : null}
					{this.music && (tab == 'preview' || tab == 'make') ? <div className="player">
						<div>
							<div className="avatar" onClick={() => this.audio.playPause()}>
								<Image src={this.music.image} className={`image ${this.audio.playing ? 'rotate' : ''}`} />
								{this.audio.playing
									? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" className="control">
										<path d="M384 256a42.666667 42.666667 0 0 0-42.666667-42.666667H298.666667a42.666667 42.666667 0 0 0-42.666667 42.666667v554.666667a42.666667 42.666667 0 0 0 42.666667 42.666666h42.666666a42.666667 42.666667 0 0 0 42.666667-42.666666V256z m384 0a42.666667 42.666667 0 0 0-42.666667-42.666667h-42.666666a42.666667 42.666667 0 0 0-42.666667 42.666667v554.666667a42.666667 42.666667 0 0 0 42.666667 42.666666h42.666666a42.666667 42.666667 0 0 0 42.666667-42.666666V256z"></path>
									</svg>
									: <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" className="control">
										<path d="M768 506.026667v11.946666a32.426667 32.426667 0 0 1-15.786667 27.733334L370.346667 768c-23.04 13.653333-34.986667 13.653333-45.226667 7.68l-10.666667-5.973333a32.426667 32.426667 0 0 1-15.786666-26.88V281.173333a32.426667 32.426667 0 0 1 15.786666-27.733333l10.666667-5.973333c10.24-5.973333 22.186667-5.973333 52.053333 11.52l375.04 219.306666a32.426667 32.426667 0 0 1 15.786667 27.733334z"></path>
									</svg>}
							</div>
							<div className="progress">
								<div className="current" style={{ width: this.audio.percent + '%' }}>
									<div className="dot" onMouseDown={e => this.handleProgressDown(e.nativeEvent)}></div>
								</div>
							</div>
						</div>
					</div> : null}
				</div>
			</div>
		)
	}
}