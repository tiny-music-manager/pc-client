/**
 * 专辑详情页
 */
import './index.scss'
import { apis } from "../../api"
import { Filter } from "../../components/filter"
import { MusicGroup, MusicGroupItem } from "../../components/music-group"
import { i18n } from "../../i18n"
import { history } from "../../libs/consts"
import { IAlbum } from "../../libs/datatype"
import { Page } from "../../libs/page"
import { AlbumDetailPage } from "./detail"


interface IAlbumPageState {
	//过滤
	pych?: string
	page?: number
	limit?: number
	//结果
	albums?: Array<IAlbum>
	count?: number
	finish: boolean
}

export { AlbumDetailPage }

export class AlbumPage extends Page<{}, IAlbumPageState> {
	private abcFilter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map(ch => ({ key: ch, value: ch }))
	private loading = false
	private limit = 100

	componentDidMount() {
		this.loadAlbums(1, true, undefined)
	}

	private async loadAlbums(page: number, reload: boolean, pych: string | undefined) {
		//检测是否结束
		if (!reload) {
			if (pych == this.state.pych && this.state.finish) return
		}
		//加载中处理
		if (this.loading) return
		this.loading = true
		//加载并显示
		const { count, limit, albums } = await apis.album.filter({ pych, page, limit: this.limit })
		this.loading = false
		this.setState({
			albums: reload ? albums : [...this.state.albums ?? [], ...albums],
			count,
			page,
			limit,
			pych,
			finish: albums.length < limit,
		})
	}

	render() {
		const { albums, pych } = this.state ?? {}
		return (
			<div id="album-page">
				<div className="page-title">{i18n.album.title.string}</div>
				{/* 过滤器 */}
				<Filter
					items={[
						{ key: 'all', value: i18n.album.abcFilterAll.string },
						...this.abcFilter
					]}
					onChange={key => this.loadAlbums(1, true, key == 'all' ? undefined : key)}
					selected={pych ?? 'all'}
				/>
				{/* 数据列表 */}
				<div className="music-group-container" onScroll={e => this.handleScrollLoad(e, () => this.loadAlbums((this.state.page ?? 1) + 1, false, pych))}>
					{!albums?.length ? null : <MusicGroup
						title={''}
						pageMode="list"
						data={albums}
						titleHeight={50}
						itemRender={album => <MusicGroupItem
							key={album.id}
							title={album.name}
							image={album.pic}
							onClick={() => history.push(`/album/${album.id}`)}
						/>}
					/>}
				</div>
			</div>
		)
	}

}