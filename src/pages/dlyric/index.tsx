import './index.scss'
import { LyricPlayLine } from "../../libs/lyric-line"
import React from 'react'
import type { IUConfig } from '../../libs/datatype'

//桌面歌词
export class DLyric extends React.Component {
	private actionDom = React.createRef<HTMLDivElement>()

	//原生实现的api
	private dlyricApi = (window as any).dlyric
	//歌词样式
	private styleDom = document.createElement('style')
	//字体定义
	private fontDom = document.createElement('style')

	//歌词行
	private lines: Array<LyricPlayLine> = []
	//播放的行
	private playLines: [LyricPlayLine | null, LyricPlayLine | null] = [null, null]
	//当前时间
	private time: number = 0

	//字体
	private fonts?: Array<{ id: string, url: string }>
	//样式
	private style?: IUConfig['lyric']

	async componentDidMount() {
		//添加样式dom
		document.head.appendChild(this.styleDom)
		document.head.appendChild(this.fontDom)
		//监听配置消息
		this.dlyricApi.onConfig((type: string, data: any) => {
			// console.log('config', type, data)
			switch (type) {
				// 设置歌词
				case 'lyric':
					this.handleLyric(data)
					break
				//收到时间
				case 'time':
					this.handleTime(data * 1000)
					break
				case 'style':
					this.style = data
					this.updateStyle()
					break
				case 'fonts':
					this.fonts = data
					this.updateFont()
					break
			}
		})
		//检测鼠标是否处于“窗口移动”图标上，如果是，则需要启用鼠标事件，否则忽略鼠标事件，以实现穿透
		setInterval(() => {
			if (!this.actionDom.current) return
			const btns = this.actionDom.current.children
			if (!btns.length) return

			const { mouse, window } = this.dlyricApi.points()
			for (let i = 0; i < btns.length; ++i) {
				const rct = btns[i].getBoundingClientRect()
				const ix = window.x + rct.left
				const iy = window.y + rct.top
				const ir = ix + rct.width
				const ib = iy + rct.height
				if (mouse.x > ix && mouse.y > iy && mouse.x < ir && mouse.y < ib) {
					this.dlyricApi.ignoreMouseEvent(false)
				}
				else this.dlyricApi.ignoreMouseEvent(true)
			}
		}, 100)
	}

	private updateFont() {
		this.fontDom.innerHTML = this.fonts?.map(font => `@font-face{font-family: font_${font.id};src: url('${font.url}');}`).join('\n') ?? ''
		this.forceUpdate()
	}

	//更新样式
	private updateStyle() {
		const { style, } = this
		//歌词样式
		this.styleDom.innerHTML = style ? `
			.lyric-line{
				font-size: ${style.font.size}px;
				font-weight: ${style.font.bold ? 'bold' : 'normal'};
				font-family: 'font_${style.font.id}';
			}

			.lyric-line:not(.lyric-played) .item {
				background-image: linear-gradient(to bottom, ${style.color.wait.join(',')});
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}

			.lyric-line .item>div,
			.lyric-line.lyric-played .item,
			.lyric-line .item.lyric-played {
				background-image: linear-gradient(to bottom, ${style.color.play.join(',')});
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
		`: ''
		this.forceUpdate()
	}

	//处理时间
	private handleTime(time: number) {
		if (!this.lines) return
		this.time = time
		//查找当前行和下一行
		for (let i = 0; i < this.lines.length; ++i) {
			if (this.lines[i].isCurrent(time)) {
				//显示到上面
				if (i % 2 == 0) this.playLines = [this.lines[i], this.lines[i + 1] ?? null]
				//显示到下面
				else this.playLines = [this.lines[i + 1] ?? null, this.lines[i]]
				break
			}
		}
		//刷新解密
		this.forceUpdate()
	}

	//处理歌词
	private handleLyric(lyric: [number, string | [number, string][]][]) {
		this.lines = lyric.map((line, n) => new LyricPlayLine(lyric, n))
		this.playLines = [this.lines[0] ?? null, this.lines[1] ?? null]
		this.forceUpdate()
	}

	render() {
		return (
			<div id="dlyric" className={this.style?.align ?? 'left-right'}>
				<div className="flex"></div>
				{/* 歌词 */}
				{this.playLines.map((line, N) => {
					const key = `${N}_${line?.start ?? 0}`
					if (!line) return <div key={key}></div>

					const playing = line.isPlaying(this.time)
					const played = line.isPlayed(this.time)
					const isCurrentLine = line.isCurrent(this.time)

					//单行歌词
					if (this.style?.align == 'single-line' && !isCurrentLine) return null

					//普通歌词
					if (line.type == 'lyric') {
						//普通歌词 isCurrentLine 和 playing一样
						return <div
							className={`lyric-line ${isCurrentLine ? 'lyric-playing lyric-current' : ''} ${played ? 'lyric-played' : ''}`}
							key={key}>
							<div className="item">{line.items[0].string}</div>
						</div>
					}
					//卡拉OK歌词
					return <div
						className={`lyric-line ${isCurrentLine ? 'lyric-current' : ''} ${playing ? 'lyric-playing' : ''} ${played ? 'lyric-played' : ''}`}
						key={`${N}_${line.start}`}
					>{line.items.map((item, index) => {
						const wplaying = line.wordPlaying(index, this.time)
						return <div
							className={`item ${(playing && line.wordPlayed(index, this.time)) ? 'lyric-played' : ''}`}
							key={index}>
							{item.string}
							{(wplaying > 0) ? <div style={{ width: `${wplaying}%` }}>{item.string}</div> : null}
						</div>
					})}</div>
				})}
				<div className="flex"></div>
				{/* 操作 */}
				<div className="actions" ref={this.actionDom}>
					<svg className="move" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M545.28 618.666667v135.04l51.093333-49.578667 44.586667 45.909333-126.442667 122.752-128.682666-122.517333 44.117333-46.357333 51.349333 48.853333-0.021333-134.122667h64z m204.757333-235.626667l122.752 126.442667-122.517333 128.682666-46.357333-44.117333 48.853333-51.349333H618.666667v-64h135.04l-49.578667-51.072 45.909333-44.586667z m-476.202666 0l45.909333 44.586667-49.6 51.072H405.333333v64h-134.229333l48.853333 51.349333-46.336 44.117333-122.517333-128.682666 122.730667-126.442667zM514.517333 151.210667l126.442667 122.752-44.586667 45.909333-51.072-49.578667L545.28 405.333333h-64v-134.101333l-51.328 48.853333-44.117333-46.357333 128.682666-122.517333z"></path>
					</svg>
				</div>
			</div>
		)
	}
}