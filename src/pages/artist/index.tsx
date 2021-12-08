import './index.scss'
import { i18n } from "../../i18n"
import { Page } from "../../libs/page"
import { IArtist } from '../../libs/datatype'
import { MusicGroup, MusicGroupItem } from '../../components/music-group'
import { Filter } from '../../components/filter'
import { ArtistDetailPage } from './detail'
import { apis } from "../../api"
import { history } from "../../libs/consts"

export { ArtistDetailPage }

interface IArtistPageState {
	//过滤
	pych?: string
	page?: number
	limit?: number
	//结果
	artists?: Array<IArtist>
	count?: number
	finish: boolean
}

export class ArtistPage extends Page<any, IArtistPageState> {
	private abcFilter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map(ch => ({ key: ch, value: ch }))
	private limit = 100
	private loading = false

	componentDidMount() {
		this.loadArtists(1, true, undefined)
	}

	private async loadArtists(page: number, reload: boolean, pych: string | undefined) {
		//检测是否结束
		if (!reload) {
			if (pych == this.state.pych && this.state.finish) return
		}
		//加载中处理
		if (this.loading) return
		this.loading = true
		//加载并显示
		const { count, limit, artists } = await apis.artist.filter({ pych, page, limit: this.limit })
		this.loading = false
		this.setState({
			artists: reload ? artists : [...this.state.artists ?? [], ...artists],
			count,
			page,
			limit,
			pych,
			finish: artists.length < limit,
		})
	}

	render() {
		const { pych, artists } = this.state ?? {}

		return (
			<div id="artist-page">
				<div className="page-title">{i18n.artist.title.string}</div>
				{/* 过滤器 */}
				<Filter
					items={[
						{ key: 'all', value: i18n.artist.abcFilterAll.string },
						...this.abcFilter
					]}
					onChange={key => this.loadArtists(1, true, key == 'all' ? undefined : key)}
					selected={pych ?? 'all'}
				/>
				{/* 歌手列表 */}
				<div className="music-group-container" onScroll={e => this.handleScrollLoad(e, () => this.loadArtists((this.state.page ?? 1) + 1, false, pych))}>
					{!artists?.length ? null : <MusicGroup
						title={""}
						pageMode="list"
						data={artists}
						titleHeight={50}
						itemRender={aritst => <MusicGroupItem
							key={aritst.id}
							title={aritst.name}
							image={aritst.avatar}
							onClick={e => history.push(`/artist/${aritst.id}`)}
						/>}
					/>}
				</div>
			</div>
		)
	}
}