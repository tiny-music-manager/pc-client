import './player.scss'
import React from "react"
import { apis } from '../../api'
import { IPlayListMusic, player, TPlayMethod } from '../../libs/player'
import { Image } from '../../components/image/image'
import { history } from '../../libs/consts'
import { util } from '../../libs/util'
import { AppbarButtons } from '../../components/appbar/btns'
import { LyricPlayLine } from '../../libs/lyric-line'
import { PlayingIcon } from '../../components/playing'
import { MusicIcon } from '../../components/icons/music-icon'
import { dataset } from '../../libs/dataset'
import { TMMComponent } from '../../libs/component'

interface IPlayerState {
	showFullScreen: boolean
	showVolumn: boolean
	volumnX: number
	volumnY: number
	showMethod: boolean
	methodX: number
	methodY: number
	showPlayList: boolean
}

interface IProgressBarState {
	progressDraging: boolean
}

function BlurBackground(props: { img: string }) {
	return <Image className="background" src={props.img} />
}

class ProgressBar extends React.Component<{}, IProgressBarState> {
	private progressDrag = { x: 0, time: 0, width: 0, replay: false }
	private progressDom = React.createRef<HTMLDivElement>()

	constructor(props: any) {
		super(props)
		this.state = { progressDraging: false }
	}

	async componentDidMount() {
		window.addEventListener('mousemove', this.handleMouseMove.bind(this))
		window.addEventListener('mouseup', this.handleMouseUp.bind(this))
	}

	componentWillUnmount() {
		window.removeEventListener('mousemove', this.handleMouseMove.bind(this))
		window.removeEventListener('mouseup', this.handleMouseUp.bind(this))
	}

	private handleMouseMove(e: MouseEvent) {
		//进度控制
		if (this.state.progressDraging) {
			let time = (e.clientX - this.progressDrag.x) / this.progressDrag.width * player.duration + this.progressDrag.time
			if (time < 0) time = 0
			if (time > player.duration - 1) time = player.duration - 1
			player.time = time
			this.forceUpdate()
		}
	}

	private handleMouseUp(e: MouseEvent) {
		if (this.state.progressDraging) {
			if (this.progressDrag.replay) player.play()
			this.setState({ progressDraging: false })
		}
	}

	private handleProgressDraging(e: MouseEvent) {
		e.stopPropagation()
		//保存必要数据
		if (!this.progressDom.current) return
		const rail = this.progressDom.current
		this.progressDrag.x = e.clientX
		this.progressDrag.time = player.time
		this.progressDrag.width = rail?.clientWidth ?? 0
		this.progressDrag.replay = player.playing
		player.pause()
		//完成
		this.setState({ progressDraging: true })
	}

	render() {
		const { progressDraging } = this.state
		return (
			<div className={`progress ${progressDraging ? 'draging' : ''}`} ref={this.progressDom} onMouseDown={e => {
				if (!this.progressDom.current) return
				const dom = this.progressDom.current
				const percent = (e.clientX - dom.getBoundingClientRect().left) / dom.clientWidth
				const time = player.time = player.duration * percent
				nativeApi.lyric.dlyricConfig('time', time)
			}}>
				<div className="rail">
					<div className="buffered" style={{ width: `${player.buffered / player.duration * 100}%` }}></div>
					<div className="played" style={{ width: `${player.percent}%` }}>
						<div className="dot" onMouseDown={e => {
							e.stopPropagation()
							this.handleProgressDraging(e.nativeEvent)
						}} onClick={e => e.stopPropagation()}></div>
					</div>
				</div>
			</div>
		)
	}
}

class PlayControl extends React.Component<{ onShowVolumn: (e: React.MouseEvent<SVGElement>) => any, onShowMethod: (e: React.MouseEvent<SVGElement>) => any }> {
	render() {
		return (
			<div className="play-controls">
				{/* 单曲循环 */}
				{player.method == 'single' ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onShowMethod}>
					<path d="M192 789.333333a21.24 21.24 0 0 1-12.8-4.28 344.513333 344.513333 0 0 1-99.333333-118A341.246667 341.246667 0 0 1 384 170.666667h256q6.36 0 12.733333 0.233333l-49.153333-49.146667a21.333333 21.333333 0 0 1 30.173333-30.173333l85.333334 85.333333a21.333333 21.333333 0 0 1 0 30.173334l-85.333334 85.333333a21.333333 21.333333 0 0 1-30.173333-30.173333l48.666667-48.666667Q646.126667 213.333333 640 213.333333H384c-164.666667 0-298.666667 134-298.666667 298.666667 0 94.833333 43.546667 181.933333 119.48 238.966667A21.333333 21.333333 0 0 1 192 789.333333z m228.433333 143.06a21.333333 21.333333 0 0 0 0-30.173333l-49.153333-49.146667q6.366667 0.233333 12.733333 0.233334H640a341.46 341.46 0 0 0 304.146667-496.42 344.513333 344.513333 0 0 0-99.333334-118 21.333333 21.333333 0 1 0-25.626666 34.113333C895.12 330.066667 938.666667 417.166667 938.666667 512c0 164.666667-134 298.666667-298.666667 298.666667H384q-6.12 0-12.246667-0.246667l48.666667-48.666667a21.333333 21.333333 0 0 0-30.173333-30.173333l-85.333334 85.333333a21.333333 21.333333 0 0 0 0 30.173334l85.333334 85.333333a21.333333 21.333333 0 0 0 30.173333 0zM554.666667 618.666667V405.333333a21.333333 21.333333 0 0 0-21.333334-21.333333h-42.666666a21.333333 21.333333 0 0 0 0 42.666667h21.333333v192a21.333333 21.333333 0 0 0 42.666667 0z"></path>
				</svg> : null}
				{/* 列表循环 */}
				{player.method == 'list' ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onShowMethod}>
					<path d="M192 789.333333a21.24 21.24 0 0 1-12.8-4.28 344.513333 344.513333 0 0 1-99.333333-118A341.246667 341.246667 0 0 1 384 170.666667h256q6.36 0 12.733333 0.233333l-49.153333-49.146667a21.333333 21.333333 0 0 1 30.173333-30.173333l85.333334 85.333333a21.333333 21.333333 0 0 1 0 30.173334l-85.333334 85.333333a21.333333 21.333333 0 0 1-30.173333-30.173333l48.666667-48.666667Q646.126667 213.333333 640 213.333333H384c-164.666667 0-298.666667 134-298.666667 298.666667 0 94.833333 43.546667 181.933333 119.48 238.966667A21.333333 21.333333 0 0 1 192 789.333333z m228.433333 143.06a21.333333 21.333333 0 0 0 0-30.173333l-49.153333-49.146667q6.366667 0.233333 12.733333 0.233334H640a341.46 341.46 0 0 0 304.146667-496.42 344.513333 344.513333 0 0 0-99.333334-118 21.333333 21.333333 0 1 0-25.626666 34.113333C895.12 330.066667 938.666667 417.166667 938.666667 512c0 164.666667-134 298.666667-298.666667 298.666667H384q-6.12 0-12.246667-0.246667l48.666667-48.666667a21.333333 21.333333 0 0 0-30.173333-30.173333l-85.333334 85.333333a21.333333 21.333333 0 0 0 0 30.173334l85.333334 85.333333a21.333333 21.333333 0 0 0 30.173333 0z"></path>
				</svg> : null}
				{/* 随机播放 */}
				{player.method == 'random' ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onShowMethod}>
					<path d="M682.48 297.633333L332.666667 752.386667A149.333333 149.333333 0 0 1 214.306667 810.666667H64a21.333333 21.333333 0 0 1 0-42.666667h150.306667a107.333333 107.333333 0 0 0 84.546666-41.633333L648.666667 271.613333A149.333333 149.333333 0 0 1 767.026667 213.333333h141.473333l-48.92-48.913333a21.333333 21.333333 0 0 1 30.173333-30.173333l85.333334 85.333333a21.333333 21.333333 0 0 1 0 30.173333l-85.333334 85.333334a21.333333 21.333333 0 0 1-30.173333-30.173334l48.92-48.913333h-141.473333a107.333333 107.333333 0 0 0-84.546667 41.633333zM64 256h150.306667a107.333333 107.333333 0 0 1 84.546666 41.633333l109.26 142.04a21.333333 21.333333 0 0 0 33.82-26L332.666667 271.613333A149.333333 149.333333 0 0 0 214.306667 213.333333H64a21.333333 21.333333 0 0 0 0 42.666667z m825.753333 432.913333a21.333333 21.333333 0 0 0-30.173333 30.173334l48.92 48.913333h-141.473333a107.333333 107.333333 0 0 1-84.546667-41.633333L573.22 584.326667a21.333333 21.333333 0 0 0-33.82 26L648.666667 752.386667a149.333333 149.333333 0 0 0 118.36 58.28h141.473333l-48.92 48.913333a21.333333 21.333333 0 0 0 30.173333 30.173333l85.333334-85.333333a21.333333 21.333333 0 0 0 0-30.173333z"></path>
				</svg> : null}
				{/* 上一曲 */}
				<svg className="play-control" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={() => player.prev()}>
					<path d="M362.3 512l445-332.3v664.5L362.3 512zM216.7 179.7h80v664.5h-80V179.7z"></path>
				</svg>
				{/* 播放、暂停 */}
				<div className="play-pause play-control" onClick={() => player.playPause()}>
					{/* 播放 */}
					{!player.playing ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M744.727273 551.563636L325.818182 795.927273c-30.254545 18.618182-69.818182-4.654545-69.818182-39.563637v-488.727272c0-34.909091 39.563636-58.181818 69.818182-39.563637l418.909091 244.363637c30.254545 16.290909 30.254545 62.836364 0 79.127272z"></path>
					</svg> : null}
					{/* 暂停 */}
					{player.playing ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M706.300776 161.01416c34.018791 0 61.868069 34.232662 61.868069 76.049047L768.168846 786.93577c0 41.859363-27.849278 76.05007-61.868069 76.05007l-30.933523 0c-34.104749 0-61.954027-34.190707-61.954027-76.05007L613.413226 237.063207c0-41.816384 27.849278-76.049047 61.954027-76.049047L706.300776 161.01416z"></path>
						<path d="M348.717681 161.01416c34.018791 0 61.868069 34.232662 61.868069 76.049047L410.585751 786.93577c0 41.859363-27.849278 76.05007-61.868069 76.05007l-30.933523 0c-34.104749 0-61.954027-34.190707-61.954027-76.05007L255.830131 237.063207c0-41.816384 27.849278-76.049047 61.954027-76.049047L348.717681 161.01416z"></path>
					</svg> : null}
				</div>
				{/* 下一曲 */}
				<svg className="play-control" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }} onClick={() => player.next()}>
					<path d="M362.3 512l445-332.3v664.5L362.3 512zM216.7 179.7h80v664.5h-80V179.7z"></path>
				</svg>
				{/* 音量0 */}
				{player.volum == 0 ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onShowVolumn}>
					<path d="M448 938.666667a21.333333 21.333333 0 0 1-15.093333-6.246667L225.833333 725.333333H53.333333a53.393333 53.393333 0 0 1-53.333333-53.333333V352a53.393333 53.393333 0 0 1 53.333333-53.333333h172.5l207.08-207.086667A21.333333 21.333333 0 0 1 469.333333 106.666667v810.666666a21.333333 21.333333 0 0 1-21.333333 21.333334zM53.333333 341.333333a10.666667 10.666667 0 0 0-10.666666 10.666667v320a10.666667 10.666667 0 0 0 10.666666 10.666667h181.333334a21.333333 21.333333 0 0 1 15.086666 6.246666L426.666667 865.833333V158.166667L249.753333 335.086667A21.333333 21.333333 0 0 1 234.666667 341.333333z m964.42 377.753334a21.333333 21.333333 0 0 0 0-30.173334L840.833333 512l176.92-176.913333a21.333333 21.333333 0 1 0-30.173333-30.173334L810.666667 481.833333 633.753333 304.913333a21.333333 21.333333 0 0 0-30.173333 30.173334L780.5 512l-176.92 176.913333a21.333333 21.333333 0 0 0 30.173333 30.173334L810.666667 542.166667l176.913333 176.92a21.333333 21.333333 0 0 0 30.173333 0z"></path>
				</svg> : null}
				{/* 音量1 */}
				{player.volum > 0 && player.volum < 0.33 ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onShowVolumn}>
					<path d="M448 938.666667a21.333333 21.333333 0 0 1-15.093333-6.246667L225.833333 725.333333H53.333333a53.393333 53.393333 0 0 1-53.333333-53.333333V352a53.393333 53.393333 0 0 1 53.333333-53.333333h172.5l207.08-207.086667A21.333333 21.333333 0 0 1 469.333333 106.666667v810.666666a21.333333 21.333333 0 0 1-21.333333 21.333334zM53.333333 341.333333a10.666667 10.666667 0 0 0-10.666666 10.666667v320a10.666667 10.666667 0 0 0 10.666666 10.666667h181.333334a21.333333 21.333333 0 0 1 15.086666 6.246666L426.666667 865.833333V158.166667L249.753333 335.086667A21.333333 21.333333 0 0 1 234.666667 341.333333z m592.753334 276.273334a170.733333 170.733333 0 0 0 0-211.213334 21.333333 21.333333 0 0 0-33.486667 26.433334 127.366667 127.366667 0 0 1 0 158.346666 21.333333 21.333333 0 0 0 33.493333 26.433334z"></path>
				</svg> : null}
				{/* 音量2 */}
				{player.volum > 0.33 && player.volum < 0.66 ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onShowVolumn}>
					<path d="M448 938.666667a21.333333 21.333333 0 0 1-15.093333-6.246667L225.833333 725.333333H53.333333a53.393333 53.393333 0 0 1-53.333333-53.333333V352a53.393333 53.393333 0 0 1 53.333333-53.333333h172.5l207.08-207.086667A21.333333 21.333333 0 0 1 469.333333 106.666667v810.666666a21.333333 21.333333 0 0 1-21.333333 21.333334zM53.333333 341.333333a10.666667 10.666667 0 0 0-10.666666 10.666667v320a10.666667 10.666667 0 0 0 10.666666 10.666667h181.333334a21.333333 21.333333 0 0 1 15.086666 6.246666L426.666667 865.833333V158.166667L249.753333 335.086667A21.333333 21.333333 0 0 1 234.666667 341.333333z m664.266667 437.246667a21.333333 21.333333 0 0 1-13.733333-37.666667c6.666667-5.586667 13.146667-11.553333 19.333333-17.726666C779.6 666.78 810.666667 591.78 810.666667 512s-31.066667-154.78-87.48-211.186667c-6.173333-6.173333-12.666667-12.14-19.333334-17.726666a21.333333 21.333333 0 1 1 27.446667-32.666667 346.585333 346.585333 0 0 1 22.046667 20.213333 341.066667 341.066667 0 0 1 0 482.72 346.585333 346.585333 0 0 1-22.046667 20.213334 21.24 21.24 0 0 1-13.7 5.013333zM629.333333 625.72a21.333333 21.333333 0 0 1-16.733333-34.546667 127.366667 127.366667 0 0 0 0-158.346666 21.333333 21.333333 0 0 1 33.486667-26.433334 170.733333 170.733333 0 0 1 0 211.213334A21.333333 21.333333 0 0 1 629.333333 625.72z"></path>
				</svg> : null}
				{/* 音量3 */}
				{player.volum > 0.66 ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onShowVolumn}>
					<path d="M448 938.666667a21.333333 21.333333 0 0 1-15.093333-6.246667L225.833333 725.333333H53.333333a53.393333 53.393333 0 0 1-53.333333-53.333333V352a53.393333 53.393333 0 0 1 53.333333-53.333333h172.5l207.08-207.086667A21.333333 21.333333 0 0 1 469.333333 106.666667v810.666666a21.333333 21.333333 0 0 1-21.333333 21.333334zM53.333333 341.333333a10.666667 10.666667 0 0 0-10.666666 10.666667v320a10.666667 10.666667 0 0 0 10.666666 10.666667h181.333334a21.333333 21.333333 0 0 1 15.086666 6.246666L426.666667 865.833333V158.166667L249.753333 335.086667A21.333333 21.333333 0 0 1 234.666667 341.333333z m750.48 586.553334a21.333333 21.333333 0 0 1-12.726666-38.466667 474.853333 474.853333 0 0 0 52.78-45.553333c182.993333-182.993333 182.993333-480.74 0-663.733334a474.246667 474.246667 0 0 0-52.78-45.553333 21.333333 21.333333 0 0 1 25.42-34.273333 518.346667 518.346667 0 0 1 57.533333 49.653333 511.606667 511.606667 0 0 1 0 724.08 519.026667 519.026667 0 0 1-57.54 49.653333 21.22 21.22 0 0 1-12.686667 4.193334z m-86.213333-149.333334a21.333333 21.333333 0 0 1-13.733333-37.666666c6.666667-5.586667 13.146667-11.553333 19.333333-17.726667C779.6 666.78 810.666667 591.78 810.666667 512s-31.066667-154.78-87.48-211.186667c-6.173333-6.173333-12.666667-12.14-19.333334-17.726666a21.333333 21.333333 0 1 1 27.446667-32.666667 346.585333 346.585333 0 0 1 22.046667 20.213333 341.066667 341.066667 0 0 1 0 482.72 346.585333 346.585333 0 0 1-22.046667 20.213334 21.24 21.24 0 0 1-13.7 5.013333zM629.333333 625.72a21.333333 21.333333 0 0 1-16.733333-34.546667 127.366667 127.366667 0 0 0 0-158.346666 21.333333 21.333333 0 0 1 33.486667-26.433334 170.733333 170.733333 0 0 1 0 211.213334A21.333333 21.333333 0 0 1 629.333333 625.72z"></path>
				</svg> : null}
			</div>
		)
	}
}

class PlayBarIcon extends React.Component<{ name: 'love' | 'unlove' | 'more' | 'list' | 'lyric', className?: string, onClick?: (e: React.MouseEvent<SVGElement>) => any }> {
	render() {
		const className = `link black ${this.props.className ?? ''}`
		switch (this.props.name) {
			case 'list': return (
				<svg className={className} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onClick}>
					<path d="M934.4 76.8h-79.36c-79.36 0-145.92 64-145.92 143.36v373.76c-33.28-25.6-74.24-38.4-117.76-38.4-110.08 0-197.12 87.04-197.12 197.12s89.6 197.12 197.12 197.12 197.12-87.04 197.12-197.12V220.16C788.48 184.32 819.2 153.6 855.04 153.6h79.36c23.04 0 38.4-17.92 38.4-38.4S954.88 76.8 934.4 76.8zM591.36 867.84c-66.56 0-117.76-53.76-117.76-117.76s53.76-117.76 117.76-117.76c66.56 0 117.76 53.76 117.76 117.76s-53.76 117.76-117.76 117.76zM89.6 156.16H537.6c23.04 0 38.4-17.92 38.4-38.4S560.64 76.8 537.6 76.8H89.6C69.12 76.8 51.2 94.72 51.2 115.2s17.92 40.96 38.4 40.96zM89.6 394.24H537.6c23.04 0 38.4-17.92 38.4-38.4s-17.92-38.4-38.4-38.4H89.6c-20.48-2.56-38.4 15.36-38.4 38.4s17.92 38.4 38.4 38.4zM327.68 555.52H89.6c-23.04 0-38.4 17.92-38.4 38.4s17.92 38.4 38.4 38.4h238.08c23.04 0 38.4-17.92 38.4-38.4 0-23.04-15.36-38.4-38.4-38.4z"></path>
				</svg>
			)
			case 'love': return (
				<svg className={className} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onClick}>
					<path d="M522.24 851.968l-335.872-354.304s-4.096-4.096-8.192-10.24c-6.144-8.192-12.288-18.432-18.432-30.72-34.816-65.536-38.912-135.168 2.048-200.704 20.48-34.816 47.104-57.344 77.824-71.68 38.912-18.432 81.92-22.528 118.784-16.384 6.144 2.048 10.24 2.048 12.288 2.048 10.24 4.096 22.528-2.048 24.576-14.336 4.096-10.24-2.048-22.528-14.336-24.576-4.096 0-10.24-2.048-16.384-4.096-45.056-8.192-96.256-4.096-143.36 20.48-36.864 18.432-67.584 47.104-94.208 88.064-51.2 79.872-45.056 163.84-4.096 241.664 12.288 22.528 22.528 38.912 30.72 49.152l352.256 370.688 14.336 14.336 374.784-374.784c24.576-24.576 49.152-79.872 55.296-135.168 8.192-73.728-14.336-145.408-71.68-202.752-104.448-104.448-227.328-90.112-333.824-20.48-20.48 14.336-57.344 49.152-106.496 100.352l-12.288 12.288c-24.576 24.576-49.152 51.2-73.728 77.824-8.192 10.24-16.384 18.432-24.576 26.624-4.096 4.096-8.192 8.192-8.192 10.24-8.192 8.192-6.144 20.48 2.048 28.672 8.192 8.192 20.48 6.144 28.672-2.048 2.048-2.048 4.096-4.096 8.192-10.24 6.144-8.192 14.336-16.384 24.576-26.624 24.576-26.624 49.152-53.248 73.728-77.824l12.288-12.288c47.104-49.152 83.968-81.92 100.352-94.208 92.16-61.44 194.56-73.728 282.624 14.336 49.152 49.152 67.584 108.544 61.44 169.984-6.144 47.104-24.576 92.16-43.008 110.592l-307.2 303.104-49.152 49.152 8.192-6.144z"></path>
				</svg>
			)
			case 'unlove': return (
				<svg className={className} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onClick}>
					<path style={{ transform: 'scale(1.1) translate(-30px, 0px)' }} d="M817.624615 216.615385l23.236923-22.843077a19.692308 19.692308 0 0 1 27.766154 27.766154L833.575385 256v1.181538l-521.846154 521.452308a19.692308 19.692308 0 0 1-27.766154-27.963077l35.84-36.036923C192.196923 598.055385 118.153846 489.550769 118.153846 386.363077a203.224615 203.224615 0 0 1 62.818462-148.086154 216.615385 216.615385 0 0 1 301.883077 0A219.569231 219.569231 0 0 1 512 273.92a219.569231 219.569231 0 0 1 29.144615-35.643077 216.615385 216.615385 0 0 1 275.692308-21.267692z m-28.356923 28.356923a177.230769 177.230769 0 0 0-220.553846 21.070769 170.535385 170.535385 0 0 0-38.4 57.304615 19.692308 19.692308 0 0 1-36.627692 0 170.535385 170.535385 0 0 0-38.4-57.304615 177.230769 177.230769 0 0 0-246.941539 0A164.233846 164.233846 0 0 0 157.538462 386.363077c0 89.009231 69.513846 190.227692 190.227692 300.504615zM866.461538 386.363077a167.187692 167.187692 0 0 0-9.058461-54.744615 137.846154 137.846154 0 0 0-8.073846-19.692308 19.692308 19.692308 0 1 1 35.249231-16.541539 179.790769 179.790769 0 0 1 10.043076 23.827693 204.603077 204.603077 0 0 1 11.224616 67.150769c0 91.569231-56.516923 188.849231-154.387692 289.28a1489.723077 1489.723077 0 0 1-228.43077 187.470769 19.692308 19.692308 0 0 1-23.433846 0c-4.529231-3.741538-72.073846-56.32-98.461538-77.193846l-10.436923-8.664615a19.692308 19.692308 0 0 1 25.00923-30.326154l10.436923 8.270769c19.692308 16.147692 64.787692 51.396923 86.252308 68.135385C712.073846 686.276923 866.461538 525.193846 866.461538 386.363077z" p-id="14123"></path>
				</svg>
			)
			case 'more': return (
				<svg className={className} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onClick}>
					<path d="M675.328 117.717333A425.429333 425.429333 0 0 0 512 85.333333C276.352 85.333333 85.333333 276.352 85.333333 512s191.018667 426.666667 426.666667 426.666667 426.666667-191.018667 426.666667-426.666667c0-56.746667-11.093333-112-32.384-163.328a21.333333 21.333333 0 0 0-39.402667 16.341333A382.762667 382.762667 0 0 1 896 512c0 212.074667-171.925333 384-384 384S128 724.074667 128 512 299.925333 128 512 128c51.114667 0 100.8 9.984 146.986667 29.12a21.333333 21.333333 0 0 0 16.341333-39.402667zM298.666667 554.666667a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z m213.333333 0a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z m213.333333 0a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z"></path>
				</svg>
			)
			case 'lyric': return (
				<svg className={className} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" onClick={this.props.onClick}>
					<path d="M221.7472 395.5712H78.0288a26.7264 26.7264 0 0 1-26.368-27.136c0-14.8992 11.776-27.0336 26.368-27.0336h170.1376c14.592 0 26.368 12.1344 26.368 27.0848v491.9296l84.3264-67.7376a25.9584 25.9584 0 0 1 37.0688 4.608 27.5456 27.5456 0 0 1-4.4544 37.9904l-126.976 102.0928a25.9584 25.9584 0 0 1-37.0176-4.5568 27.5456 27.5456 0 0 1-5.632-16.7936V395.5712H221.696z m237.4656-274.944a26.7264 26.7264 0 0 1-26.4192-27.136c0-14.8992 11.8272-27.0336 26.4192-27.0336h422.4c43.7248 0 79.2064 36.352 79.2064 81.2544v758.1184c0 44.9024-35.4816 81.2544-79.2064 81.2544a26.7264 26.7264 0 0 1-26.4192-27.0848c0-14.9504 11.8272-27.0848 26.4192-27.0848a26.7264 26.7264 0 0 0 26.368-27.0848V147.712a26.7264 26.7264 0 0 0-26.368-27.136h-422.4z m32.5632 240.3328a26.7264 26.7264 0 0 1-26.4192-27.0848c0-14.9504 11.8272-27.0848 26.4192-27.0848h316.8256c14.5408 0 26.368 12.1344 26.368 27.0848 0 14.9504-11.776 27.0848-26.368 27.0848H491.776zM512 472.576h263.9872c29.184 0 52.8384 24.2688 52.8384 54.1696v162.5088c0 29.9008-23.6544 54.1184-52.8384 54.1184H512c-29.184 0-52.7872-24.2176-52.7872-54.1184v-162.5088c0-29.9008 23.6032-54.1184 52.7872-54.1184z m0 54.1696v162.5088h263.9872v-162.5088H512zM148.992 79.5648a27.136 27.136 0 0 1-20.1728-32.256 26.4192 26.4192 0 0 1 31.4368-20.6336c33.4336 7.4752 65.9968 27.0848 97.7408 58.2656 30.976 30.3104 52.8896 60.8768 65.536 91.9552 5.632 13.824-0.7168 29.696-14.1312 35.4304a26.1632 26.1632 0 0 1-34.56-14.5408c-9.5744-23.552-27.2384-48.1792-53.3504-73.728-25.1904-24.7296-49.408-39.3216-72.5504-44.4928z"></path>
				</svg>
			)
		}
	}
}

export class Player extends TMMComponent<{}, IPlayerState> {

	private lines?: Array<LyricPlayLine>

	private volumnDrag = { y: 0, volumn: 0, height: 0 }
	private volumnDom = React.createRef<HTMLDivElement>()
	private lyricMainDom = React.createRef<HTMLDivElement>()

	private currentMusicId = ''
	private lyricCurrentIndex = 0
	private dlyricShow = false
	private currentLyric: [number, string | [number, string][]][] | null = null

	constructor(props: any) {
		super(props)
		this.state = { showFullScreen: false, showVolumn: false, volumnX: 0, volumnY: 0, showMethod: false, methodX: 0, methodY: 0, showPlayList: false }
	}

	async componentDidMount() {
		window.addEventListener('mousemove', this.handleMouseMove.bind(this))
		window.addEventListener('mousedown', this.handleMouseDown.bind(this))
		window.addEventListener('mouseup', this.handleMouseUp.bind(this))
		player.onupdate = () => {
			nativeApi.lyric.dlyricConfig('time', player.time)		//桌面歌词时间设置
			this.forceUpdate(() => this.scrollLyric())
			if (player.music && this.currentMusicId != player.music?.id) {
				this.currentMusicId = player.music.id
				this.handleMusicChange(player.music)
			}
		}
		setInterval(() => {
			const showing = nativeApi.lyric.isShowing()
			if (this.dlyricShow != showing) {
				this.dlyricShow = showing
				this.forceUpdate()
			}
		}, 1000)
	}

	componentWillUnmount() {
		window.removeEventListener('mousemove', this.handleMouseMove.bind(this))
		window.removeEventListener('mousedown', this.handleMouseDown.bind(this))
		window.removeEventListener('mouseup', this.handleMouseUp.bind(this))
	}

	private scrollLyric() {
		//找到滚动元素
		if (!this.lyricMainDom.current) return
		const main = this.lyricMainDom.current
		let dom!: HTMLDivElement
		for (let i = 0; i < main.children.length; ++i) {
			if ((main.children[i] as HTMLDivElement).classList.contains('lyric-current')) {
				if (this.lyricCurrentIndex == i) return
				this.lyricCurrentIndex = i
				dom = main.children[i] as HTMLDivElement
				break
			}
		}
		// console.log('scroll')
		if (!dom) return
		//滚动
		const top = (dom.offsetTop - (main.children[0] as HTMLDivElement).offsetTop) - (main.clientHeight / 2) + dom.clientHeight
		// if (top < 0) return
		main.scrollTop = top
	}

	private async handleMusicChange(music: IPlayListMusic) {
		const info = await apis.music.info({ id: music.id })
		this.currentLyric = (info.lyric ? nativeApi.lyric.parseLyric(info.lyric) : null)?.body ?? null
		//生成行信息
		if (this.currentLyric) this.lines = this.currentLyric.map((line, n) => new LyricPlayLine(this.currentLyric!, n))
		else this.lines = undefined
		//桌面歌词
		nativeApi.lyric.dlyricConfig('lyric', this.currentLyric ?? [])
		//更新
		this.forceUpdate(() => this.scrollLyric())
	}

	private handleMouseDown() {
		this.setState({
			showVolumn: false,
			showMethod: false,
			showPlayList: false,
		})
	}

	private handleMouseMove(e: MouseEvent) {
		//音量拖动
		if (this.volumnDrag.y) {
			let volumn = (this.volumnDrag.y - e.clientY) / this.volumnDrag.height + this.volumnDrag.volumn
			if (volumn < 0) volumn = 0
			if (volumn > 1) volumn = 1
			player.volum = volumn
			this.forceUpdate()
		}
	}

	private handleMouseUp(e: MouseEvent) {
		if (this.volumnDrag.y) {
			this.volumnDrag.y = 0
		}
	}

	private handleVolumnDraging(e: MouseEvent) {
		e.stopPropagation()
		if (!this.volumnDom.current) return
		this.volumnDrag.y = e.clientY
		this.volumnDrag.height = this.volumnDom.current.clientHeight ?? 0
		this.volumnDrag.volumn = player.volum
	}

	private showVolumn(e: React.MouseEvent<SVGElement>) {
		e.stopPropagation()
		const rct = (e.target as SVGElement).getBoundingClientRect()
		this.setState({
			showVolumn: true,
			volumnX: rct.left - 60 / 2 + rct.width / 2,
			volumnY: rct.top - 150 - 10,
		})
	}

	private showMethod(e: React.MouseEvent<SVGElement>) {
		e.stopPropagation()
		const rct = (e.target as SVGElement).getBoundingClientRect()
		this.setState({
			showMethod: true,
			methodX: rct.left - 60 / 2 + rct.width / 2,
			methodY: rct.top - 125 - 10,
		})
	}

	private handleSetMethod(method: TPlayMethod) {
		player.method = method
		this.forceUpdate()
	}

	private switchDlyric() {
		this.dlyricShow = !this.dlyricShow
		this.forceUpdate()
		nativeApi.lyric.show(this.dlyricShow)
		nativeApi.lyric.dlyricConfig('lyric', this.currentLyric ?? [])
	}

	render() {
		const { showFullScreen, volumnX, volumnY, showVolumn, showMethod, methodX, methodY, showPlayList } = this.state ?? {}
		if (!player.music) return null
		const currentTime = player.time * 1000

		return (
			<div className="player" id="bottom-player">
				{/* 进度条 */}
				<ProgressBar />
				{/* 内容 */}
				<div className="bar-body">
					<div className="music-info">
						<Image className="image" src={player.music?.image} type='api' string={player.music?.name} onClick={() => this.setState({ showFullScreen: true })} />
						<div className="infos">
							<div className="music-name">
								<span>{player.music?.name}</span>
								{player.music.artists.length ? <span> - </span> : null}
								{player.music.artists.map((artist, index, artists) => {
									return [
										<span className="link black" key={artist.id} onClick={() => history.push(`/artist/${artist.id}`)}>{artist.name}</span>,
										(index == artists.length - 1) ? '' : ',',
									]
								})}
							</div>
							<div>
								{/* 喜欢 */}
								{/* <PlayBarIcon name="love" />
								<PlayBarIcon name="unlove" /> */}
								{player.music && dataset.love.musics.includes(player.music.id) ?
									<PlayBarIcon name="unlove" onClick={e => this.handleLove('music', player.music!)} /> :
									<PlayBarIcon name="love" onClick={e => this.handleLove('music', player.music!)} />}
								{/* 更多 */}
								{player.music ? <PlayBarIcon name="more" onClick={e => this.handleMore(e, player.music!)} /> : null}
							</div>
						</div>
					</div>
					{/* 播放控制 */}
					<PlayControl onShowVolumn={this.showVolumn.bind(this)} onShowMethod={this.showMethod.bind(this)} />
					<div className="more-actions">
						<div>{util.durationStr(player.time)}/{util.durationStr(player.duration)}</div>
						{/* 桌面歌词 */}
						<PlayBarIcon name="lyric" className={this.dlyricShow ? 'dlyric-show' : ''} onClick={this.switchDlyric.bind(this)} />
						{/* 播放列表 */}
						<PlayBarIcon name="list" onClick={() => this.setState({ showPlayList: true })} />
					</div>
				</div>
				{/* 音量浮窗 */}
				<div className="volumn-pop player-pop" style={{ display: showVolumn ? '' : 'none', left: volumnX, top: volumnY }} onMouseDown={e => e.stopPropagation()}>
					<div className="volum-progress" ref={this.volumnDom} onClick={e => {
						if (!this.volumnDom.current) return
						const dom = this.volumnDom.current
						player.volum = 1 - (e.clientY - dom.getBoundingClientRect().top) / dom.clientHeight
					}}>
						<div>
							<div className="rail" style={{ height: `${player.volum * 100}%` }}>
								<div className="dot" onMouseDown={e => {
									e.stopPropagation()
									this.handleVolumnDraging(e.nativeEvent)
								}} onClick={e => e.stopPropagation()}></div>
							</div>
						</div>
					</div>
				</div>
				{/* 播放方式浮窗 */}
				<div className="method-pop player-pop" style={{ display: showMethod ? '' : 'none', left: methodX, top: methodY }} onMouseDown={e => e.stopPropagation()}>
					<div className="method-item" onClick={() => this.handleSetMethod('list')}>列表播放</div>
					<div className="method-item" onClick={() => this.handleSetMethod('single')}>单曲播放</div>
					<div className="method-item" onClick={() => this.handleSetMethod('random')}>随机播放</div>
				</div>
				{/* 播放列表 */}
				{<div className="play-list" style={{ transform: `translateX(${showPlayList ? '0' : '100%'})`, opacity: showPlayList ? 1 : 0 }} onMouseDown={e => e.stopPropagation()}>
					<div className="title">播放列表</div>
					<div className="list">
						{player.playList.map(music => <div key={music.id} className={player.music?.id == music.id ? 'playing' : ''} onClick={() => player.play(music.id)}>
							{player.music?.id == music.id ? <PlayingIcon /> : null}
							<span>{music.name}</span>
							{music.artists.length ? ' - ' : ''}
							{music.artists.map((ar, index, artists) => [
								<span key={ar.id}>{ar.name}</span>,
								(index == artists.length - 1) ? '' : ',',
							])}
						</div>)}
					</div>
				</div>}
				{/* 全屏播放 */}
				<div className="fullscreen-view" style={{
					transform: `translateY(${showFullScreen ? '0' : '100%'})`,
					opacity: showFullScreen ? 1 : 0.2,
				}}>
					{/* <img src={`${apiURL}/${player.music.image}`} alt="" className="background" /> */}
					{/* <BlurBackground img={player.music.image} /> */}
					<div className="main">
						{/* 标题栏 */}
						<div className="title">
							{/* 退出 */}
							<div className="exit" onClick={() => this.setState({ showFullScreen: false })}>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
									<path d="M958.009 307.2c0-9.317-3.554-18.636-10.663-25.746-14.219-14.218-37.273-14.218-51.491 0l-383.854 383.856-383.854-383.856c-14.219-14.218-37.271-14.218-51.49 0-14.219 14.22-14.219 37.271 0 51.491l409.6 409.6c14.219 14.218 37.271 14.218 51.49 0l409.6-409.6c7.109-7.11 10.663-16.429 10.663-25.746z"></path>
								</svg>
							</div>
							{/* 空白 */}
							<div className="flex"></div>
							{/* 操作栏 */}
							<AppbarButtons
								btns={['maximize', 'minimize', 'close']}
								onBtnClick={(btn, e) => {
									if (btn == 'close') nativeApi.window.show(false)
									else if (btn == 'minimize') nativeApi.window.minimize()
									else if (btn == 'maximize') nativeApi.window.maximize(true)
									else if (btn == 'restore') nativeApi.window.maximize(false)
								}}
								currentSize={(nativeApi.window.getState()?.maximized) ? 'maximize' : 'normal'}
							/>
						</div>
						{/* 歌曲信息 */}
						<div className="music-title center">
							<div className="left"></div>
							<div className="right">
								{/* 歌曲吗 */}
								<div className="music-name">{player.music.name}</div>
								{/* 歌手 */}
								{player.music.artists.length ? <div className="music-ext">
									<span>歌手:</span>
									{player.music.artists.map((ar, index, artists) => [
										<span key={ar.id} onClick={() => history.push(`/artist/${ar.id}`)}>{ar.name}</span>,
										index == artists.length - 1 ? '' : ',',
									])}
								</div> : null}
								{/* 专辑 */}
								{player.music.albums.length ? <div className="music-ext">
									<span>专辑:</span>
									{player.music.albums.map((al, index, albums) => [
										<span key={al.id} onClick={() => history.push(`/album/${al.id}`)}>{al.name}</span>,
										index == albums.length - 1 ? '' : ',',
									])}
								</div> : null}
							</div>
						</div>
						{/* 图片和歌词 */}
						<div className="music-lyric center">
							<div className="left">
								<Image className="image" src={player.music.image} type="api" string={player.music.name} />
							</div>
							<div className="right" ref={this.lyricMainDom}>
								{this.lines ? this.lines.map((line, N) => {
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
								}) : '无歌词'}
							</div>
						</div>
						{/* 操作栏 */}
						<div className="control-bar">
							{/* 进度条 */}
							<ProgressBar />
							{/* 内容区域 */}
							<div className="body">
								<div className="left">
									{/* 喜欢 */}
									{player.music && dataset.love.musics.includes(player.music.id) ?
										<PlayBarIcon name="unlove" onClick={e => this.handleLove('music', player.music!)} /> :
										<PlayBarIcon name="love" onClick={e => this.handleLove('music', player.music!)} />}
									{/* 更多 */}
									{player.music ? <PlayBarIcon name="more" onClick={e => this.handleMore(e, player.music!)} /> : null}
									{/* 时间 */}
									<div className="time-info">
										{util.durationStr(player.time)} / {util.durationStr(player.duration)}
									</div>
								</div>
								{/* 播放控制 */}
								<PlayControl onShowVolumn={this.showVolumn.bind(this)} onShowMethod={this.showMethod.bind(this)} />
								<div className="right">
									{/* 桌面歌词 */}
									<PlayBarIcon name="lyric" className={this.dlyricShow ? 'dlyric-show' : ''} onClick={this.switchDlyric.bind(this)} />
									{/* 播放列表 */}
									<PlayBarIcon name="list" onClick={() => this.setState({ showPlayList: true })} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}