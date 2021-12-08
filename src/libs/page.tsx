import React from "react"
import type { RouteComponentProps } from 'react-router-dom'
import { apis } from "../api"
import { createDialog } from "../components/popover"
import { TMMComponent } from "./component"
import { dataset } from "./dataset"
import { IMusic } from "./datatype"
import { player } from "./player"

//添加歌单表单信息
class PlaylistCreateForm extends React.Component<{ info: { name: string } }> {
	render() {
		const { info } = this.props
		return (
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<div>歌单名称：</div>
				<input type="text" className="input" value={info.name} onChange={e => {
					info.name = e.target.value
					this.forceUpdate()
				}} />
			</div>
		)
	}
}


/**
 * 定义页面
 * @param Props props类型的定义
 * @param States state类型的定义
 * @param Params 页面参数类型的定义
 */
export class Page<Props = {}, States = {}, Params = undefined> extends TMMComponent<RouteComponentProps<Params> & Props, States> {
	//构造函数
	constructor(props: any) {
		super(props)
		this.state = {} as any
	}

	/**
	 * 参数信息
	 */
	public get params(): Params {
		return this.props.match.params
	}

	/**
	 * 处理滚动加载
	 * @param e 事件
	 * @param loader 滚动处理函数
	 */
	protected handleScrollLoad(e: React.UIEvent<HTMLDivElement, UIEvent>, loader?: () => any) {
		//滚动加载
		const self = (e.target as HTMLDivElement)
		if (self.clientHeight + self.scrollTop < self.scrollHeight - 300) return
		//加载
		loader?.()
	}

	/**
	 * 播放列表的音乐
	 * @param musics 音乐列表
	 * @param id 要播放的音乐的ID
	 */
	protected handlePlay(musics?: Array<IMusic>, id?: string) {
		if (!musics?.length) return
		player.playList = musics
		player.play(id ?? 0)		//没有ID则播放第0个
	}

	private async _handleCreatePlaylist(music: string) {
		const res = { name: '' }
		if (!await createDialog('新建歌单', <PlaylistCreateForm info={res} />).wait()) return
		const name = res.name.trim()
		if (!name) return											//无输入
		if (dataset.playlists.some(l => l.name == name)) return		//存在相同的
		//加入
		await this._handleSaveToPlaylist(music, name)
		//刷新一下歌单
		dataset.playlists = await apis.playlist.list({})
	}

	private async _handleSaveToPlaylist(music: string, list: string) {
		await apis.playlist.save({ music, list, action: 'add' })
	}

	/**
	 * 处理添加到图标点击
	 * @param e 事件
	 * @param musicId 音乐ID
	 * @param onSelect 处理选择和取消选择
	 */
	protected handleAddTo(e: React.MouseEvent | MouseEvent, musicId: string, onSelect?: (musicId?: string) => any) {
		if (!dataset.user) return this.openLogin()

		this
			.menu([
				{ key: '--0', label: '新建歌单', onClick: () => this._handleCreatePlaylist(musicId) },
				'div',
				...dataset.playlists.length ? [] : [{
					key: '--1',
					label: '无歌单',
					disabled: true,
				}],
				...dataset.playlists.map(list => ({
					key: list.id,
					label: list.name,
					onClick: () => this._handleSaveToPlaylist(musicId, list.name)
				})),
			])
			.showByEvent(e)
			.onClose(() => onSelect?.(undefined))

		onSelect?.(musicId)
	}
}