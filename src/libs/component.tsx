import React from "react"
import { apis } from "../api"
import { createDialog } from "../components/popover"
import { dataset } from "./dataset"
import type { IKind, IMusic } from "./datatype"
import type { IPlayListMusic } from "./player"
import { util } from "./util"

interface IMenu {
	key: string
	label: string
	disabled?: boolean
	onClick?: () => any
}

class MusicDetailDialogContent extends React.Component<{ music: IMusic | IPlayListMusic | string }, { music?: IMusic, types?: IKind[] }> {

	async componentDidMount() {
		const id = (typeof this.props.music == 'string') ? this.props.music : this.props.music.id
		const music = await apis.music.info({ id })
		const types = await apis.kind.list({})
		this.setState({ music, types })
	}

	render() {
		const { music, types } = this.state ?? {}

		if (!music) return (<div className="music-details">
			正在加载...
		</div>)

		return (<div className="music-details">
			<div className="music-detail-item">
				<div>ID</div>
				<div>{music.id}</div>
			</div>
			<div className="music-detail-item">
				<div>名称</div>
				<div>{music.name}</div>
			</div>
			<div className="music-detail-item">
				<div>歌手</div>
				<div>{music.artists.map(artist => artist.name).join('、')}</div>
			</div>
			<div className="music-detail-item">
				<div>专辑</div>
				<div>{music.albums.map(album => album.name).join('、')}</div>
			</div>
			<div className="music-detail-item">
				<div>类型</div>
				<div>{types?.filter(type => music.types.includes(type.id)).map(t => t.name).join('、')}</div>
			</div>
			<div className="music-detail-item">
				<div>时长</div>
				<div>{util.durationStr(music.duration)}</div>
			</div>
			<div className="music-detail-item">
				<div>比特率</div>
				<div>{music.bitrate ? `${music.bitrate.rate}${music.bitrate.unit}ps` : '未知'}</div>
			</div>
			<div className="music-detail-item">
				<div>Hash</div>
				<div>{music.hash}</div>
			</div>
		</div>)
	}

}

export class TMMComponent<P, S> extends React.Component<P, S> {
	static #menuCloseCBs: Array<() => any>

	private static closeAllMenu(exclude?: HTMLElement) {
		document.querySelectorAll<HTMLDivElement>('body>.tmm-menu').forEach(item => {
			if (item == exclude) return
			item.remove()
		})
		this.#menuCloseCBs.forEach(func => func())
		this.#menuCloseCBs.splice(0)
	}

	constructor(props: any) {
		super(props)
		//类初始化
		if (!TMMComponent.#menuCloseCBs) {
			TMMComponent.#menuCloseCBs = []
			document.addEventListener('click', e => TMMComponent.closeAllMenu())
		}

		this.state = {} as any
	}

	/**
	 * 打开登录窗口
	 */
	protected openLogin() {
		import("../pages/editor/user/login").then(({ LoginDialog }) => {
			LoginDialog.open({})
		})
	}

	/**
	 * 创建菜单
	 * @param items 菜单项
	 * @returns 菜单
	 */
	protected menu(items: Array<IMenu | 'div'>) {
		const dom = document.createElement('div')
		dom.className = 'tmm-menu'
		dom.onclick = e => e.stopPropagation()

		items.forEach(item => {
			const div = document.createElement('div')
			if (item === 'div') {
				div.className = 'div'
				div.appendChild(document.createElement('div'))
			}
			else {
				div.classList.add('menu')
				if (item.disabled) div.classList.add('disabled')
				div.innerHTML = item.label
				if (!item.disabled) div.onclick = (e) => {
					item.onClick?.()
					TMMComponent.closeAllMenu()
				}
			}
			dom.appendChild(div)
		})
		document.body.appendChild(dom)

		const menuHandler = {
			onClose(cb: () => any) {
				TMMComponent.#menuCloseCBs.push(cb)
				return this
			}
		}


		return {
			showByEvent(e: React.MouseEvent | MouseEvent) {
				e.stopPropagation()
				return this.show(e.clientX, e.clientY)
			},
			show(x: number, y: number) {
				TMMComponent.closeAllMenu(dom)
				const drect = dom.getBoundingClientRect()
				if (x + drect.width > window.innerWidth) x = x - drect.width
				if (y + drect.height > window.innerHeight) y = y - drect.height
				if (x < 0) x = 0
				if (y < 0) y = 0
				dom.style.left = x + 'px'
				dom.style.top = y + 'px'
				return menuHandler
			},
			showCustom(callback: (opt: { dom: HTMLDivElement }) => ({ x: number, y: number })) {
				const { x, y } = callback({ dom })
				return this.show(x, y)
			}
		}
	}

	/** 关闭所有菜单 */
	protected closeAllMenu() {
		TMMComponent.closeAllMenu()
	}

	/**
	 * 处理喜欢，添加/删除
	 * @param type 类型
	 * @param id ID
	 */
	protected async handleLove(type: 'album' | 'artist' | 'music', data?: { id: string, name: string }) {
		if (!data) return
		if (!dataset.user) return this.openLogin()

		const key = `${type}s` as `${typeof type}s`
		let loveList = dataset.love[key]

		//移除
		if (loveList.includes(data.id)) {
			const msg = {
				album: `是否取消收藏专辑《${data.name}》?`,
				artist: `是否取消收藏歌手"${data.name}"?`,
				music: `是否取消收藏音乐《${data.name}》?`,
			}[type]

			if (!await createDialog('取消收藏', msg).wait()) return
			await apis.love.save({ type: type, action: 'del', id: data.id })
			loveList = loveList.filter(a => a != data.id)
		}
		//添加
		else {
			await apis.love.save({ type: type, action: 'add', id: data.id })
			loveList = [...loveList, data.id]
		}

		//更新
		dataset.love = { ...dataset.love, [key]: loveList }
	}

	/**
	 * 判断是否在喜欢中
	 * @param id ID
	 */
	protected inLove(id: string) {
		return {
			get album() {
				return dataset.love.albums.includes(id)
			},
			get artist() {
				return dataset.love.artists.includes(id)
			},
			get music() {
				return dataset.love.musics.includes(id)
			},
		}
	}

	/**
	 * 点击...图标
	 */
	protected handleMore(e: React.MouseEvent<HTMLDivElement | SVGElement>, music: IPlayListMusic | IMusic) {
		const showDetail = () => {
			createDialog('歌曲信息', <MusicDetailDialogContent music={music} />, { className: 'music-details', okText: '', cancelText: '' })
		}
		//如果当前用户是管理员，则打开管理菜单
		if (dataset.user?.admin) this.menu([
			{ key: 'detail', label: '歌曲信息', onClick: showDetail },
			'div',
			{
				key: 'lyric', label: '歌词管理', onClick: () => import('../pages/editor/lryic/manager').then(res => {
					res.LyricManager.open({ music: music.id })
				})
			},
			{
				key: 'lyric', label: '为歌曲制作歌词', onClick: () => import('../pages/editor/lryic/editor').then(res => {
					res.LyricEditor.open({ music: music.id, lyric: undefined })
				})
			},
			'div',
			{
				key: 'lyric', label: '歌曲信息修改', onClick: () => import('../pages/editor/music/editor').then(res => {
					res.MusicEditor.open({ music: music.id })
				})
			},
		]).showByEvent(e)
		//否则打开详情页
		else showDetail()
	}

}