import './index.scss'
import React from "react"
import { groupItemPadding } from '../../libs/consts'
import { util } from '../../libs/util'
import { Image } from '../image/image'

interface IMusicGroupProps<T> {
	className?: string
	title: React.ReactNode
	pageMode: 'scroll' | 'list'
	titleHeight?: number
	data: Array<T>
	pwidth?: number
	itemRender?: (item: T) => React.ReactNode
}

interface IMusicGroupRowProps {
	className?: string
}

interface IMusicGroupItemProps {
	className?: string
	title: string
	image?: string
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => any
}

export class MusicGroupRow extends React.Component<IMusicGroupRowProps>{
	render() {
		return (
			<div className={`musig-group-row ${this.props.className ?? ''}`}>
				{this.props.children}
			</div>
		)
	}
}

export class MusicGroupItem extends React.Component<IMusicGroupItemProps> {
	render() {
		return (
			<div className={`music-group-item ${this.props.className ?? ''}`} style={{ opacity: 0 }} onClick={this.props.onClick} ref={dom => {
				if (!dom) return
				dom.style.marginLeft = (dom.parentElement?.children?.[0] == dom) ? '0' : `${groupItemPadding}px`
				//从爷爷处读取宽高并设置
				const container = dom.parentElement?.parentElement as HTMLDivElement
				if (container) {
					setTimeout(() => {
						let width = parseFloat(container.getAttribute('item-width') ?? '0')
						let height = parseFloat(container.getAttribute('item-height') ?? '0')
						dom.style.width = width + 'px'
						dom.style.height = height + 'px'
						//设置图片的宽高
						const imageElem = dom.querySelector<HTMLDivElement>('div.music-group-item-image')
						if (imageElem) {
							imageElem.style.width = imageElem.style.height = width + 'px'
							imageElem.style.fontSize = (width / 165 * 4) + 'em'			//宽度为165时，使用4em，基于此缩放就好了
						}
						dom.style.opacity = '1'
					}, 10);
				}
			}}>
				<Image className="music-group-item-image" src={this.props.image} string={this.props.title} />
				<div className="music-group-item-title"><span className="link black" title={this.props.title}>{this.props.title}</span></div>
			</div>
		)
	}
}

export class MusicGroup<T> extends React.Component<IMusicGroupProps<T>> {
	private container: HTMLDivElement | null = null
	private groupMainElem: HTMLDivElement | null = null
	private current: number = 0
	#switching = false			//是否正在切换

	//上一个孩子
	private get prev(): HTMLDivElement {
		const items = this.container!.children
		if (this.current <= 0) return items[items.length - 1] as any
		else return items[this.current - 1] as any
	}

	//下一个孩子
	private get next(): HTMLDivElement {
		const items = this.container!.children
		if (this.current >= items.length - 1) return items[0] as any
		else return items[this.current + 1] as any
	}

	//切换，1:上一个，-1:下一个
	private switchTo(index: number) {
		const items = this.container!.children
		if (this.#switching || items.length <= 1) return
		const current = items[this.current] as HTMLDivElement
		//下一个
		if (index == 1) {
			this.#switching = true
			const next = this.next
			//清除样式，并设置预期位置
			next.style.display = 'none'
			next.style.transition = 'none'
			next.style.transform = 'translateX(100%)'
			next.style.display = ''
			//滚动
			setTimeout(() => {
				next.style.transition = ''
				current.style.transform = 'translateX(-100%)'
				next.style.transform = 'translateX(0)'
				//下一个
				this.current++
				if (this.current >= items.length) this.current = 0
				this.#switching = false
			}, 10);
		}
		//上一个
		else if (index == -1) {
			this.#switching = true
			const prev = this.prev
			//清除样式，并设置预期位置
			prev.style.display = 'none'
			prev.style.transition = 'none'
			prev.style.transform = 'translateX(-100%)'
			prev.style.display = ''
			//滚动
			setTimeout(() => {
				prev.style.transition = ''
				current.style.transform = 'translateX(100%)'
				prev.style.transform = 'translateX(0)'
				//上一个
				this.current--
				if (this.current < 0) this.current = items.length - 1
				this.#switching = false
			}, 10);
		}
	}

	private initialItems() {
		const items = this.container?.children
		if (items?.length) {
			if (!items.length) return
			for (let i = 0; i < items.length; ++i) {
				(items[i] as HTMLDivElement).style.display = 'none'
			}
			const current = items[this.current] as HTMLDivElement
			current.style.transform = ''
			current.style.display = ''
		}
	}

	private scrollRender(groups: Array<Array<T>>, width: number, height: number) {
		if (this.current >= groups.length) {
			this.current = groups.length - 1
			if (this.current < 0) this.current = 0
			setTimeout(() => this.switchTo(0), 100);
		}
		setTimeout(this.initialItems.bind(this), 10);

		return [
			/* 上一个图标 */
			(groups.length > 1) ? <div className="scroll-left" onClick={() => this.switchTo(-1)} key="sl">
				<svg className="link black" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M431.309446 514.760876l204.746448-469.230978c4.65129-10.666219-0.546262-22.941995-11.612602-27.42598-11.06634-4.482977-23.809766 0.526105-28.463071 11.1893L388.162812 505.564122c-8.26448 12.419901 4.497087 34.043611-0.139085 23.101238l206.678522 482.295911c4.535385 10.709557 17.223378 15.851676 28.337088 11.479564 11.115726-4.36808 16.450347-16.594471 11.914961-27.306044L431.309446 514.760876z"></path></svg>
			</div> : null,
			/* 下一个图标 */
			(groups.length > 1) ? <div className="scroll-right" onClick={() => this.switchTo(1)} key="sr">
				<svg className="link black" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}><path d="M431.309446 514.760876l204.746448-469.230978c4.65129-10.666219-0.546262-22.941995-11.612602-27.42598-11.06634-4.482977-23.809766 0.526105-28.463071 11.1893L388.162812 505.564122c-8.26448 12.419901 4.497087 34.043611-0.139085 23.101238l206.678522 482.295911c4.535385 10.709557 17.223378 15.851676 28.337088 11.479564 11.115726-4.36808 16.450347-16.594471 11.914961-27.306044L431.309446 514.760876z"></path></svg>
			</div> : null,
			/* 内容 */
			<div className={`group-content mode-${this.props.pageMode}`} style={{ height: height + 'px' }} ref={dom => {
				if (!dom) return
				dom.setAttribute('item-width', width + '')
				dom.setAttribute('item-height', height + '')
				if (!this.container) setTimeout(() => this.forceUpdate(), 10);
				this.container = dom
			}} key="ct">
				{this.props.itemRender ? groups.map((group, index) => <MusicGroupRow key={index}>
					{group.map(item => this.props.itemRender!(item))}
				</MusicGroupRow>) : null}
			</div>,
		].filter(d => !!d)
	}

	private listRender(groups: Array<Array<T>>, width: number, height: number) {
		return (
			<div ref={dom => {
				if (!dom) return
				dom.setAttribute('item-width', width + '')
				dom.setAttribute('item-height', height + '')
			}}>
				{this.props.itemRender ? groups.map((group, index) => <MusicGroupRow key={index}>
					{group.map(item => this.props.itemRender!(item))}
				</MusicGroupRow>) : null}
			</div>
		)
	}

	render() {
		let groups: Array<Array<T>> = []
		let width = 0
		let height = 0
		if (this.groupMainElem) {
			const ret = util.groupData(this.groupMainElem.clientWidth, this.props.data ?? [], this.props.pwidth ?? 1)
			groups = ret.result
			width = ret.itemWidth
			height = width + (this.props.titleHeight ?? 0) + 10
		}

		return (
			<div className={`music-group ${this.props.className ?? ''}`} ref={dom => {
				if (!dom) return
				if (!this.groupMainElem) setTimeout(() => this.forceUpdate(), 10);
				this.groupMainElem = dom
			}}>
				<div className="group-title">{this.props.title}</div>
				<div className="group-container">
					{this.props.pageMode == 'scroll' ? this.scrollRender(groups, width, height) : this.listRender(groups, width, height)}
				</div>
			</div>
		)
	}
}